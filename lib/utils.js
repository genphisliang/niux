
import _ from 'lodash';

const utils = {
  /* 数据diff, source没有的字段直接忽略 */
  diff(srcData, modifyData) {
    const ret = [];

    function generateKey(key, prex) {
      const tmpArr = [].concat(prex);

      tmpArr.push(key);
      return tmpArr.join('.');
    }

    function compare(srcD, modify, prex) {
      Object.keys(srcD || {}).map((key) => {
        const tmpPrex = _.cloneDeep(prex);

        if (typeof modify[key] !== 'undefined') {
          if (typeof (srcD[key]) === 'object') {
            if (srcD[key] instanceof Array) {
              /** 数组处理方法 */
              if (modify[key] && modify[key] instanceof Array) {
                const results = utils.diffArray(srcD[key], modify[key]);

                Object.keys(results || []).map((i) => {
                  let tmpKey = '';

                  if (results[i].key === 'array_length') {
                    tmpKey = generateKey(`${key}.length`, prex);
                  } else if (results[i].key === 'array') {
                    tmpKey = generateKey(key, prex);
                  }

                  ret.push({
                    key: tmpKey,
                    source: results[i].source,
                    modify: results[i].modify
                  });

                  return true;
                });
              } else {
                ret.push({
                  key: generateKey(key, prex),
                  source: _.cloneDeep(srcD[key]),
                  modify: _.cloneDeep(modify[key])
                });
              }
            } else {
              /** 对象处理方案 */
              tmpPrex.push(key);
              compare(srcD[key], modify[key], tmpPrex);
            }
          } else if (srcD[key] !== modify[key]) {
            /* 直接变量，非数组非对象 */
            ret.push({
              key: generateKey(key, tmpPrex),
              source: _.cloneDeep(srcD[key]),
              modify: _.cloneDeep(modify[key])
            });
          }
        }

        return true;
      });
    }

    compare(srcData, modifyData, []);

    return ret;
  },
  /** 数组层面的数据diff */
  diffArray(srcData, modifyData) {
    const ret = [];

    if (srcData.length !== modifyData.length) {
      ret.push({
        key: 'array_length',
        source: _.cloneDeep(srcData),
        modify: _.cloneDeep(modifyData)
      });
    }

    /** 检查数据内容是否一致 */
    function isArrayModify(data, modify) {
      let bModify = false;

      const dataStr = JSON.stringify(data || {});
      const modifyStr = JSON.stringify(modify || {});

      if (dataStr !== modifyStr) {
        bModify = true;
      }

      return bModify;
    }

    if (isArrayModify(srcData, modifyData)) {
      ret.push({
        key: 'array',
        source: _.cloneDeep(srcData),
        modify: _.cloneDeep(modifyData)
      });
    }

    return ret;
  },
  trim(str) {
    return (str && str.replace(/(^\s*)|(\s*$)/g, '')) || '';
  }
};

export default utils;
