import {
  concat,
  difference,
  differenceBy,
  differenceWith,
  drop,
  dropRight,
  dropRightWhile,
  dropWhile,
  fill,
  flatten,
  flattenDeep,
  flattenDepth,
  fromPairs,
  intersection,
  intersectionBy,
  intersectionWith,
  last,
  lastIndexOf,
  nth,
  pull,
  take,
  union,
  unionBy,
  unionWith,
  xor,
  xorBy,
  xorWith,
  zip,
  zipWith,

  reduce,
  reduceRight,
  sample,
  sampleSize,
  some,

  assign,
  assignIn,
  assignInWith,
  assignWith,
  defaults,
  defaultsDeep,
  merge,
  mergeWith,
  omit,
  omitBy,
  pick,
  pickBy
} from 'lodash'

export const lodash = {
  concat: (left, right) => {
    return concat(left, right)
  },
  difference: (left, right) => {
    return difference(left, right)
  },
  differenceBy: (left, right, key) => {
    return differenceBy(left, right, key)
  },
  differenceWith: (left, right, key) => {
    return differenceWith(left, right, key)
  },
  drop: (left, right, key) => {
    return drop([...left, ...right], key)
  },
  dropRight: (left, right, key) => {
    return dropRight([...left, ...right], key)
  },
  dropRightWhile: (left, right, func) => {
    return dropRightWhile([...left, ...right], func)
  },
  dropWhile: (left, right, func) => {
    return dropWhile([...left, ...right], func)
  },
  fill: (left, right, ...rest) => {
    return fill([...left, ...right], rest)
  },
  flatten: (left, right, ...rest) => {
    return flatten([...left, ...right])
  },
  flattenDeep: (left, right) => {
    return flattenDeep([...left, ...right])
  },
  flattenDepth: (left, right, key) => {
    return flattenDepth([...left, ...right], key)
  },
  fromPairs: (left, right) => {
    return fromPairs(left, right)
  },
  intersection: (left, right) => {
    return intersection(left, right)
  },
  intersectionBy: (left, right, func) => {
    return intersectionBy(left, right, func)
  },
  intersectionWith: (left, right, func) => {
    return intersectionWith(left, right, func)
  },
  last: (left, right) => {
    return last([...left, ...right])
  },
  lastIndexOf: (left, right, ...rest) => {
    return lastIndexOf([...left, ...right], rest)
  },
  nth: (left, right, key) => {
    return nth([...left, ...right], key)
  },
  pull: (left, right, ...rest) => {
    return pull([...left, ...right], rest)
  },
  take: (left, right, key) => {
    return take([...left, ...right], key)
  },
  union: (left, right) => {
    return union(left, right)
  },
  unionBy: (left, right, key) => {
    return unionBy(left, right, key)
  },
  unionWith: (left, right, key) => {
    return unionWith(left, right, key)
  },
  xor: (left, right) => {
    return xor(left, right)
  },
  xorBy: (left, right, key) => {
    return xorBy(left, right, key)
  },
  xorWith: (left, right, key) => {
    return xorWith(left, right, key)
  },
  zip: (left, right) => {
    return zip(left, right)
  },
  zipWith: (left, right, func) => {
    return zipWith(left, right, func)
  },
  reduce: (left, right) => {
    return reduce(left, right)
  },
  reduceRight: (left, right) => {
    return reduceRight(left, right)
  },
  sample: (left, right) => {
    return sample(left, right)
  },
  sampleSize: (left, right, key) => {
    return sample(left, right, key)
  },
  some: (left, right, key) => {
    return some(left, right, key)
  }
}
