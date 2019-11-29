import Serverless from 'serverless'
import ServerlessAWSResolvers from '../src'

export function createFakeServerless() {
  const sls = new Serverless()
  // Attach the plugin
  sls.pluginManager.addPlugin(ServerlessAWSResolvers)
  sls.init()
  return sls
}
