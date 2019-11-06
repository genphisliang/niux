##一款用于数据管理的工具



##创建store实例，每个store实例之间数据是完全隔离的
```

import { CreateStore } from './niux';

export default CreateStore({
  state: {
    param1: 1,
    param2: 2,
    obj: {
      aa: {
        cc: 1
      }
    },
    arr: [1, 2, { a: 2 }]
  },
  actions: {
    modifyPassword() {
      this.setState({
        obj: {
          aa: {
            cc: 'www'
          }
        }
      });
    },
    modifyName(name) {
      this.setState({ name });
    }
  }
});
```

## 观察数据变化回调
```
// 观察数组
store.observe([
    {
      key: 'param_1',
      callback(data) {
        console.log(data);
      }
    }, {
      key: ' obj_1.aa.cc, param_2',
      callback: cb1
    }, {
      key: 'arr_1.length',
      callback(data) {
        console.log(data);
      }
    }
]);

/** 关注单个回调 */
store.observe({
    key: 'obj_1.aa',
    callback: cb1
});

/** 同时取消关注多个 */
store.releaseObserve([
    'obj_1.aa',
    {
      key: 'obj_1.aa',
      callback: cb1
    }
]);

/** 取消单个关注 */
store.releaseObserve({
    key: 'obj_1.aa',
    callback: cb1
});

/** 取消单个关注 */
store.releaseObserve('param1');
```

## dom模块调用
```
import store from './store';
store.modifyPassword('123456');
```
