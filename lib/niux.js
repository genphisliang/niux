/**
 * name: niux
 * desc:一款数据管理工具
 * auth：wenjing.liang
 * date：2019.10.29
 */
// eslint-disable-next-line max-classes-per-file
import _ from 'lodash';
import utils from './utils';

const watchMap = {};

/** 设置观察者队列 observerList */
function bindObserverList(obs, observerList) {
  /** 查重,判断回调事件是否已经绑定 */
  function isCbRepeat(evt, cb) {
    let isRepeat = false;

    Object.keys(evt || []).map((i) => {
      if (evt[i] === cb) {
        isRepeat = true;
      }
      return true;
    });

    return isRepeat;
  }

  /** 设置观察者到观察者队列 */
  function bindObserver(obj) {
    const keyArr = obj.key.split(',');

    Object.keys(keyArr).map((i) => {
      const curKey = utils.trim(keyArr[i]);
      const evt = observerList[curKey];

      /** 回调事件挂载到 单个key下面。 如果单个key挂载多个回调的话，挂载一个数组 */
      if (evt) {
        if (evt instanceof Array) {
        /** 数组对象处理 */

          /** 查重， 有重复的直接跳过，不插入回调队列 */
          if (!isCbRepeat(evt, obj.callback)) {
            evt.push(obj.callback);
          }
        } else {
        /** 目前单个对象，非数组对象 */
          const tmp = [evt];

          /** 排重，过滤重复的回调事件，非重复的回调插入观察者队列 */
          if (evt !== obj.callback) {
            tmp.push(obj.callback);
            observerList[curKey] = tmp;
          }
        }
      } else {
        observerList[curKey] = obj.callback;
      }

      return true;
    });
  }

  /** 遍历观察者队列 */
  if (obs) {
    if (obs instanceof Array) {
      Object.keys(obs || []).map((i) => {
        const item = obs[i];
        bindObserver(item);
        return true;
      });
    } else {
      bindObserver(obs);
    }
  }
}

/** 解绑观察者队列 observerList */
function releaseObserverList(obs, observerList) {
  /** 解绑观察者到观察者队列 */
  function releaseObserver(obj) {
    if (obj) {
      if (typeof obj === 'object') {
        if (observerList[obj.key]) {
          const cbs = observerList[obj.key];

          if (cbs instanceof Array) {
            const iIndex = cbs.indexOf(obj.callback);

            if (iIndex > -1) {
              cbs.splice(iIndex, 1);

              if (cbs.length === 0) {
                delete observerList[obj.key];
              }

              if (cbs.length === 1) {
                observerList[obj.key] = cbs.shift();
              }
            }
          } else if (obj.callback === cbs) {
            delete observerList[obj.key];
          }
        }
      } else {
        delete observerList[obj];
      }
    }
  }

  /** 遍历观察者队列 */
  if (obs) {
    if (obs instanceof Array) {
      Object.keys(obs || []).map((i) => {
        const item = obs[i];
        releaseObserver(item);
        return true;
      });
    } else {
      releaseObserver(obs);
    }
  }
}

/** 设置/修改state，通过diff设置的字段变化 */
function setStateByDiff(diffData, state) {
  /** 通过key值设定 state, 只要是给state赋值，就需要深拷贝 */
  function setStateByKey(keyStr, modify) {
    const keyArr = keyStr.split('.');
    let tmp = state;

    Object.keys(keyArr).map((i) => {
      if (i < keyArr.length - 1) {
        tmp = tmp[keyArr[i]];
      } else {
        tmp[keyArr[i]] = _.cloneDeep(modify);
      }

      return true;
    });
  }

  /** 遍历diffData，把每一个变化的值赋值给state */
  Object.keys(diffData).map((i) => {
    setStateByKey(diffData[i].key || '', diffData[i].modify, state);
    return true;
  });
}

/**
 * 通过diffData，触发观察者列表的事件回调
 * 返回数据格式
 * {
 *   key: '',
 *   oldData: '',
 *   newData: '',
 *   state: {}
 * }
 * */
function triggerObserveList(diffData, observerList, state) {
  function trigger(cb, i) {
    if (cb && diffData[i]) {
      cb({
        key: diffData[i].key,
        oldData: _.cloneDeep(diffData[i].source),
        newData: _.cloneDeep(diffData[i].modify),
        state: _.cloneDeep(state)
      });
    }
  }

  Object.keys(diffData).map((i) => {
    const cbs = observerList[diffData[i].key];

    if (cbs) {
      if (cbs instanceof Array) {
        Object.keys(cbs).map((cb) => {
          trigger(cb, i);
          return true;
        });
      } else {
        trigger(cbs, i);
      }
    }

    return true;
  });
}

class NIUX {
  constructor(props) {
    /** state，整个store都是围绕state展开 */
    const state = props.state || {};
    const observerList = {};

    /** actions对象中的action 遍历赋值到NIUX类 */
    if (props && props.actions) {
      Object.keys(props.actions).map((key) => {
        this[key] = props.actions[key];
        return true;
      });
    }

    /* 获取数据 state */
    this.getState = () => _.cloneDeep(state);

    /* 设置数据 state */
    this.setState = (modifyState) => {
      /** diff字段变化 */
      const diffData = utils.diff(state, modifyState);
      /** 设置/修改state，通过diff字段变化设置 */
      setStateByDiff(diffData, state);
      /** 通过diffData，触发观察者列表的事件回调 */
      triggerObserveList(diffData, observerList, state);
    };

    /** 关注数据变化 */
    this.observe = (obs) => {
      /** 设置观察者队列 */
      bindObserverList(obs, observerList);
    };

    /** 取消关注 */
    this.releaseObserve = (obs) => {
      /** 释放观察者队列 */
      releaseObserverList(obs, observerList);
    };
  }
}

/* 创建store实例 */
function CreateStore(config) {
  return new (class extends NIUX {
    constructor() {
      super(_.cloneDeep(config));
    }
  })();
}

/** fire一个事件 */
function fire(name, obj) {
  if(watchMap[name]) {
    Object.keys(watchMap[name]).map((i) => {
      const evt = watchMap[name][i];

      if (Object.prototype.toString.call(evt) === '[object Function]') {
        evt(obj);
      }

      return true;
    });
  }
}

/** watch一个事件 */
function watch(name, event) {
  if (event) {
    /** watch对象存在的话，直接push */
    if (watchMap[name]) {
      watchMap[name].push(event);
    } else {
      /** 从未watch过的对象，创建一个数组 */
      watchMap[name] = [event];
    }
  }
}

/* 实例化 */
export {
  CreateStore,
  fire,
  watch
};
