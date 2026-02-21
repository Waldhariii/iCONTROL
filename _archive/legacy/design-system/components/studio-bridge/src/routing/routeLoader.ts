import routeCatalog from '../../../../runtime/configs/ssot/ROUTE_CATALOG.json';

export interface RouteConfig {
  id: string;
  path: string;
  componentPath?: string;
  redirectTo?: string;
  title?: string;
  icon?: string;
  showInMenu?: boolean;
  requiredCapabilities?: string[];
}

export class RouteLoader {
  static getCpRoutes(): RouteConfig[] {
    return (routeCatalog.routes?.cp || []) as RouteConfig[];
  }
  static getAppRoutes(): RouteConfig[] {
    return (routeCatalog.routes?.app || []) as RouteConfig[];
  }
}
