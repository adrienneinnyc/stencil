import * as d from '../../declarations';
import { normalizePath } from '@utils';
import { setBooleanConfig, setNumberConfig, setStringConfig } from './config-utils';
import { isOutputTargetWww } from '../output-targets/output-utils';


export function validateDevServer(config: d.Config) {
  if (config.devServer === false || config.devServer === null) {
    return config.devServer = null;
  }
  config.devServer = config.devServer || {};

  if (typeof config.flags.address === 'string') {
    config.devServer.address = config.flags.address;
  } else {
    setStringConfig(config.devServer, 'address', '0.0.0.0');
  }

  if (typeof config.flags.port === 'number') {
    config.devServer.port = config.flags.port;
  } else {
    setNumberConfig(config.devServer, 'port', null, 3333);
  }

  if (typeof config.devServer.hotReplacement !== 'boolean') {
    config.devServer.hotReplacement = true;
  }

  setBooleanConfig(config.devServer, 'gzip', null, true);
  setBooleanConfig(config.devServer, 'openBrowser', null, true);
  setBooleanConfig(config.devServer, 'websocket', null, true);

  validateProtocol(config.devServer);

  if (config.devServer.historyApiFallback !== null && config.devServer.historyApiFallback !== false) {
    config.devServer.historyApiFallback = config.devServer.historyApiFallback || {};

    if (typeof config.devServer.historyApiFallback.index !== 'string') {
      config.devServer.historyApiFallback.index = 'index.html';
    }

    if (typeof config.devServer.historyApiFallback.disableDotRule !== 'boolean') {
      config.devServer.historyApiFallback.disableDotRule = false;
    }
  }

  if (config.flags.open === false) {
    config.devServer.openBrowser = false;
  } else if (config.flags.prerender && !config.watch) {
    config.devServer.openBrowser = false;
  }

  let serveDir: string = null;
  let baseUrl: string = null;
  const wwwOutputTarget = config.outputTargets.find(isOutputTargetWww);

  if (wwwOutputTarget) {
    serveDir = wwwOutputTarget.dir;
    baseUrl = wwwOutputTarget.baseUrl;
    config.logger.debug(`dev server www root: ${serveDir}, base url: ${baseUrl}`);

  } else {
    serveDir = config.rootDir;

    if (config.flags && config.flags.serve) {
      config.logger.debug(`dev server missing www output target, serving root directory: ${serveDir}`);
    }
  }

  if (typeof baseUrl !== 'string') {
    baseUrl = `/`;
  }

  baseUrl = normalizePath(baseUrl);

  if (!baseUrl.startsWith('/')) {
    baseUrl = '/' + baseUrl;
  }

  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  if (typeof config.devServer.logRequests !== 'boolean') {
    config.devServer.logRequests = (config.logLevel === 'debug');
  }

  setStringConfig(config.devServer, 'root', serveDir);
  setStringConfig(config.devServer, 'baseUrl', baseUrl);

  if (!config.sys.path.isAbsolute(config.devServer.root)) {
    config.devServer.root = config.sys.path.join(config.rootDir, config.devServer.root);
  }

  if (config.devServer.excludeHmr) {
    if (!Array.isArray(config.devServer.excludeHmr)) {
      config.logger.error(`dev server excludeHmr must be an array of glob strings`);
    }

  } else {
    config.devServer.excludeHmr = [];
  }

  return config.devServer;
}

function validateProtocol(devServer: d.DevServerConfig) {
  if (typeof devServer.protocol === 'string') {
    let protocol: string = devServer.protocol.trim().toLowerCase() as any;
    protocol = protocol.replace(':', '').replace('/', '');
    devServer.protocol = protocol as any;
  }
  if (devServer.protocol !== 'http' && devServer.protocol !== 'https') {
    devServer.protocol = 'http';
  }
}
