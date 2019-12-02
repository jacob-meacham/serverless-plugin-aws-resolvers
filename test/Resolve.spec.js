import AWS from 'aws-sdk-mock'
import * as helpers from './helpers.spec'
import {defaultValues, serviceConfs} from './config.spec'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('Serverless AWS Resolvers Resolves', () => {
  afterEach(() => {
    AWS.restore()
  })

  async function testResolve({scope, service, mocks, subService, testKey, testValue, serviceValue}) {
    // Init Values if not defined
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    const serverless = helpers.createFakeServerless()

    for (let mock in mocks) {
      AWS.mock(service, mocks[mock], (params, callback) => {
        const result = {}
        result[mock] = serviceValue
        callback(null, result)
      })
    }

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    return serverless.variables.populateService()
  }

  async function testResolveFallback({scope, service, method, subService, testKey}) {
    const serverless = helpers.createFakeServerless()

    serverless.service.custom.awsResolvers = {
      strict: false
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}, 'test'}`
    }

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    return new Promise((resolve, reject) => {
      try {
        let populatedPromise = serverless.variables.populateService()
        populatedPromise.then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  it('should pass through non-AWS variables', async () => {
    const serverless = helpers.createFakeServerless()
    serverless.service.custom.myVar = defaultValues.name
    let variablePromise = serverless.variables.populateService()

    return expect(variablePromise).to.eventually.be.fulfilled
      .to.be.an('Object')
      .to.have.property('custom')
      .to.have.property('myVar')
      .to.equal(defaultValues.name)
  })

  for (const service of Object.keys(serviceConfs)) {
    it(`should resolve ${service}`, async () => {
      let resolverPromise = testResolve(serviceConfs[service])

      return expect(resolverPromise).to.eventually.be.fulfilled
        .to.be.an('Object')
        .to.have.property('custom')
        .to.have.property('myVariable')
        .to.equal(serviceConfs[service].testValue || defaultValues.value)
    })

    it(`should resolve fallback value for ${service} in non-strict mode`, async () => {
      let fallbackPromise = testResolveFallback(serviceConfs[service])

      return expect(fallbackPromise).to.eventually.be.fulfilled
        .to.be.an('Object')
        .to.have.property('custom')
        .to.have.property('myVariable')
        .to.equal('test')
    })
  }
})
