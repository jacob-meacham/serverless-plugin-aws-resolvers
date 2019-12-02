import AWS from 'aws-sdk-mock'
import * as helpers from './helpers.spec'
import {defaultValues, serviceConfs} from './config.spec'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {AWSInvalidFormatError, AWSServiceNotFoundError, AWSInvalidKeysError, UnhandledServiceError, AWSEmptyResultsError, AWSTooManyResultsError, WrongResultTypeError} from '../src/errors'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('Serverless AWS Resolvers Errors', () => {
  afterEach(() => {
    AWS.restore()
  })

  async function testNotFound({scope, service, mocks, subService, testKey, testValue, serviceValue}) {
    // Init Values if not defined
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    const serverless = helpers.createFakeServerless()

    for (let mock in mocks) {
      if (subService && Object.keys(mocks).length > 1 && (mock.toLowerCase() !== subService.toLowerCase() && mock.toLowerCase() !== subService.toLowerCase() + 's')) {
        AWS.mock(service, mocks[mock], (params, callback) => {
          const result = {}
          result[mock] = serviceValue
          callback(null, result)
        })
      } else {
        AWS.mock(service, mocks[mock], (params, callback) => {
          callback(new Error('Not found'))
        })
      }
    }

    // throw new Error('lol')

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    // Returning a promise
    return serverless.variables.populateService()
  }

  async function testTooManyResults({scope, service, mocks, subService, testKey, testValue, serviceValue}) {
    // Init Values if not defined
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    const serverless = helpers.createFakeServerless()

    for (let mock in mocks) {
      if (subService && Object.keys(mocks).length > 1 && (mock.toLowerCase() !== subService.toLowerCase() && mock.toLowerCase() !== subService.toLowerCase() + 's')) {
        AWS.mock(service, mocks[mock], (params, callback) => {
          const result = {}
          result[mock] = serviceValue
          callback(null, result)
        })
      } else {
        AWS.mock(service, mocks[mock], (params, callback) => {
          let serviceValueCloned = [...serviceValue]
          let result = {}
          result[mock] = serviceValueCloned
          result[mock].push({tooMany: 'shouldThrow'})
          callback(null, result)
        })
      }
    }

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    // Returning a promise
    return serverless.variables.populateService()
  }

  async function testEmptyResults({scope, service, mocks, subService, testKey, testValue, serviceValue, MockType}) {
    // Init Values if not defined
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    MockType = MockType || Array

    const serverless = helpers.createFakeServerless()

    for (let mock in mocks) {
      if (subService && Object.keys(mocks).length > 1 && (mock.toLowerCase() !== subService.toLowerCase() && mock.toLowerCase() !== subService.toLowerCase() + 's')) {
        AWS.mock(service, mocks[mock], (params, callback) => {
          const result = {}
          result[mock] = serviceValue
          callback(null, result)
        })
      } else {
        AWS.mock(service, mocks[mock], (params, callback) => {
          let result = {}
          result[mock] = new MockType()
          callback(null, result)
        })
      }
    }

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    // Returning a promise
    return serverless.variables.populateService()
  }

  async function testWrongResults({scope, service, mocks, subService, testKey, testValue, serviceValue, MockType}) {
    // Init Values if not defined
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    MockType = MockType || Array

    const serverless = helpers.createFakeServerless()

    for (let mock in mocks) {
      if (subService && Object.keys(mocks).length > 1 && (mock.toLowerCase() !== subService.toLowerCase() && mock.toLowerCase() !== subService.toLowerCase() + 's')) {
        AWS.mock(service, mocks[mock], (params, callback) => {
          const result = {}
          result[mock] = serviceValue
          callback(null, result)
        })
      } else {
        AWS.mock(service, mocks[mock], (params, callback) => {
          callback(null, null)
        })
      }
    }

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    // Returning a promise
    return serverless.variables.populateService()
  }

  async function testResolveStrictFallback({scope, service, mocks, subService, testKey, serviceValue}) {
    const serverless = helpers.createFakeServerless()

    serverless.service.custom.awsResolvers = {
      strict: true
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}, 'test'}`
    }

    for (let mock in mocks) {
      if (subService && Object.keys(mocks).length > 1) {
        if (mock.toLowerCase() !== subService.toLowerCase() && mock.toLowerCase() !== subService.toLowerCase() + 's') {
          AWS.mock(service, mocks[mock], (params, callback) => {
            const result = {}
            result[mock] = serviceValue
            callback(null, result)
          })
        }
      } else {
        AWS.mock(service, mocks[mock], (params, callback) => {
          callback(new Error('Not found'))
        })
      }
    }

    // Returning a promise
    return serverless.variables.populateService()
  }

  it('should throw for keys that are not present', () => {
    const serverless = helpers.createFakeServerless()

    AWS.mock('Kinesis', 'describeStream', (params, callback) => {
      callback(null, {StreamDescription: {StreamARN: defaultValues.name}})
    })

    let throwKeysNotPresent = new Promise(function(resolve, reject) {
      serverless.service.custom.foo = '${aws:kinesis:test-stream:BAD_KEY}' // eslint-disable-line
      serverless.variables.populateService().then((data) => {
        resolve(data)
      }).catch((err) => {
        reject(err)
      })
    })

    return expect(throwKeysNotPresent).to.eventually.be.rejected
      .to.be.an.instanceof(AWSInvalidKeysError)
  })

  async function testUnhandledService(service, subService, slug) {
    const serverless = helpers.createFakeServerless()
    slug = slug ? service : false

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${service}:${subService}:test-key:unhandled}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${service}:test-key:unhandled}`
    }

    if (slug) serverless.service.custom.myVariable = `\${${slug}}`

    return serverless.variables.populateService()
  }

  it('should throw if service is not handled', () => {
    let unhandledServiceError = new Promise(function(resolve, reject) {
      testUnhandledService('ec3').then((data) => {
        resolve(data)
      }).catch((err) => {
        reject(err)
      })
    })

    return expect(unhandledServiceError).to.eventually.be.rejected
      .to.be.an.instanceof(UnhandledServiceError)
  })

  it('should throw if service suplied for ec2 cant be handled', () => {
    let unhandledServiceError = new Promise(function(resolve, reject) {
      testUnhandledService('ec2', 'badservice').then((data) => {
        resolve(data)
      }).catch((err) => {
        reject(err)
      })
    })

    return expect(unhandledServiceError).to.eventually.be.rejected
      .to.be.an.instanceof(UnhandledServiceError)
  })

  it('should throw if slug is incorrect', () => {
    let unhandledServiceError = new Promise(function(resolve, reject) {
      testUnhandledService('aws:servicenotresolved', null, true).then((data) => {
        resolve(data)
      }).catch((err) => {
        reject(err)
      })
    })

    return expect(unhandledServiceError).to.eventually.be.rejected
      .to.be.an.instanceof(AWSInvalidFormatError)
  })

  for (const service of Object.keys(serviceConfs)) {
    it(`should throw for ${service} not found`, () => {
      let thrownError = new Promise(function(resolve, reject) {
        testNotFound(serviceConfs[service]).then((data) => {
          resolve(data)
        }).catch((err) => {
          reject(err)
        })
      })

      return expect(thrownError).to.eventually.be.rejected
        .to.be.an.instanceof(AWSServiceNotFoundError)
    })

    it(`should not resolve fallback value for ${service} in strict mode`, () => {
      let fallbackThrownError = new Promise(function(resolve, reject) {
        testResolveStrictFallback(serviceConfs[service]).then((data) => {
          resolve(data)
        }).catch((err) => {
          reject(err)
        })
      })

      return expect(fallbackThrownError).to.eventually.be.rejected
        .to.be.an.instanceof(AWSServiceNotFoundError)
    })

    let tooManyResultsTest = true
    if (typeof serviceConfs[service].tests !== 'undefined') {
      if (typeof serviceConfs[service].tests.TooManyResults !== 'undefined') {
        tooManyResultsTest = serviceConfs[service].tests.TooManyResults
      }
    }
    if (tooManyResultsTest) {
      it(`should throw for too many ${service} returned`, () => {
        let tooManyResultsThrownError = new Promise(function(resolve, reject) {
          testTooManyResults(serviceConfs[service]).then((data) => {
            resolve(data)
          }).catch((err) => {
            reject(err)
          })
        })
        return expect(tooManyResultsThrownError).to.eventually.be.rejected
          .to.be.an.instanceof(AWSTooManyResultsError)
      })
    }

    it(`should throw for empty ${service} returned`, () => {
      let emptyResultsThrownError = new Promise(function(resolve, reject) {
        testEmptyResults(serviceConfs[service]).then((data) => {
          resolve(data)
        }).catch((err) => {
          reject(err)
        })
      })

      return expect(emptyResultsThrownError).to.eventually.be.rejected
        .to.be.an.instanceof(AWSEmptyResultsError)
    })

    it(`should throw for wrong ${service} returned`, () => {
      let wrongResultsThrownError = new Promise(function(resolve, reject) {
        testWrongResults(serviceConfs[service]).then((data) => {
          resolve(data)
        }).catch((err) => {
          reject(err)
        })
      })

      return expect(wrongResultsThrownError).to.eventually.be.rejected
        .to.be.an.instanceof(WrongResultTypeError)
    })
  }
})
