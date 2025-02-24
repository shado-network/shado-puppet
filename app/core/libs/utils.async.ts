import { SEC_IN_MSEC } from './constants.js'

export const asyncForEach = async (array: any[], callback: any) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array)
  }
}

const _asyncFilter = async (array: any[], callback: any) => {
  return Promise.all(array.map(callback)).then((results) => {
    return array.filter((_value, index) => {
      return results[index]
    })
  })
}

export const asyncSome = async (array: any[], callback: any) => {
  return (await _asyncFilter(array, callback)).length > 0
}

export const asyncEvery = async (array: any[], callback: any) => {
  return (await _asyncFilter(array, callback)).length === array.length
}

export const asyncSleep = async (seconds: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, seconds * SEC_IN_MSEC)
  })
}
