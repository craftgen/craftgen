/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as LayoutImport } from './routes/_layout'
import { Route as LayoutIndexImport } from './routes/_layout.index'
import { Route as LayoutExploreImport } from './routes/_layout.explore'
import { Route as LayoutProjectSlugIndexImport } from './routes/_layout.$projectSlug/index'
import { Route as LayoutProjectSlugWorkflowSlugLayoutImport } from './routes/_layout.$projectSlug/$workflowSlug/_layout'
import { Route as LayoutProjectSlugWorkflowSlugLayoutIndexImport } from './routes/_layout.$projectSlug/$workflowSlug/_layout.index'
import { Route as LayoutProjectSlugWorkflowSlugVVersionImport } from './routes/_layout.$projectSlug/$workflowSlug.v.$version'
import { Route as LayoutProjectSlugWorkflowSlugLayoutVersionsImport } from './routes/_layout.$projectSlug/$workflowSlug/_layout.versions'
import { Route as LayoutProjectSlugWorkflowSlugLayoutApiImport } from './routes/_layout.$projectSlug/$workflowSlug/_layout.api'

// Create Virtual Routes

const LayoutProjectSlugWorkflowSlugImport = createFileRoute(
  '/_layout/$projectSlug/$workflowSlug',
)()

// Create/Update Routes

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const LayoutRoute = LayoutImport.update({
  id: '/_layout',
  getParentRoute: () => rootRoute,
} as any)

const LayoutIndexRoute = LayoutIndexImport.update({
  path: '/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutExploreRoute = LayoutExploreImport.update({
  path: '/explore',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutProjectSlugWorkflowSlugRoute =
  LayoutProjectSlugWorkflowSlugImport.update({
    path: '/$projectSlug/$workflowSlug',
    getParentRoute: () => LayoutRoute,
  } as any)

const LayoutProjectSlugIndexRoute = LayoutProjectSlugIndexImport.update({
  path: '/$projectSlug/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutProjectSlugWorkflowSlugLayoutRoute =
  LayoutProjectSlugWorkflowSlugLayoutImport.update({
    id: '/_layout',
    getParentRoute: () => LayoutProjectSlugWorkflowSlugRoute,
  } as any)

const LayoutProjectSlugWorkflowSlugLayoutIndexRoute =
  LayoutProjectSlugWorkflowSlugLayoutIndexImport.update({
    path: '/',
    getParentRoute: () => LayoutProjectSlugWorkflowSlugLayoutRoute,
  } as any)

const LayoutProjectSlugWorkflowSlugVVersionRoute =
  LayoutProjectSlugWorkflowSlugVVersionImport.update({
    path: '/v/$version',
    getParentRoute: () => LayoutProjectSlugWorkflowSlugRoute,
  } as any)

const LayoutProjectSlugWorkflowSlugLayoutVersionsRoute =
  LayoutProjectSlugWorkflowSlugLayoutVersionsImport.update({
    path: '/versions',
    getParentRoute: () => LayoutProjectSlugWorkflowSlugLayoutRoute,
  } as any)

const LayoutProjectSlugWorkflowSlugLayoutApiRoute =
  LayoutProjectSlugWorkflowSlugLayoutApiImport.update({
    path: '/api',
    getParentRoute: () => LayoutProjectSlugWorkflowSlugLayoutRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_layout': {
      id: '/_layout'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof LayoutImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/_layout/explore': {
      id: '/_layout/explore'
      path: '/explore'
      fullPath: '/explore'
      preLoaderRoute: typeof LayoutExploreImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/': {
      id: '/_layout/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof LayoutIndexImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/$projectSlug/': {
      id: '/_layout/$projectSlug/'
      path: '/$projectSlug'
      fullPath: '/$projectSlug'
      preLoaderRoute: typeof LayoutProjectSlugIndexImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/$projectSlug/$workflowSlug': {
      id: '/_layout/$projectSlug/$workflowSlug'
      path: '/$projectSlug/$workflowSlug'
      fullPath: '/$projectSlug/$workflowSlug'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/$projectSlug/$workflowSlug/_layout': {
      id: '/_layout/$projectSlug/$workflowSlug/_layout'
      path: '/$projectSlug/$workflowSlug'
      fullPath: '/$projectSlug/$workflowSlug'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugLayoutImport
      parentRoute: typeof LayoutProjectSlugWorkflowSlugRoute
    }
    '/_layout/$projectSlug/$workflowSlug/_layout/api': {
      id: '/_layout/$projectSlug/$workflowSlug/_layout/api'
      path: '/api'
      fullPath: '/$projectSlug/$workflowSlug/api'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugLayoutApiImport
      parentRoute: typeof LayoutProjectSlugWorkflowSlugLayoutImport
    }
    '/_layout/$projectSlug/$workflowSlug/_layout/versions': {
      id: '/_layout/$projectSlug/$workflowSlug/_layout/versions'
      path: '/versions'
      fullPath: '/$projectSlug/$workflowSlug/versions'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugLayoutVersionsImport
      parentRoute: typeof LayoutProjectSlugWorkflowSlugLayoutImport
    }
    '/_layout/$projectSlug/$workflowSlug/v/$version': {
      id: '/_layout/$projectSlug/$workflowSlug/v/$version'
      path: '/v/$version'
      fullPath: '/$projectSlug/$workflowSlug/v/$version'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugVVersionImport
      parentRoute: typeof LayoutProjectSlugWorkflowSlugImport
    }
    '/_layout/$projectSlug/$workflowSlug/_layout/': {
      id: '/_layout/$projectSlug/$workflowSlug/_layout/'
      path: '/'
      fullPath: '/$projectSlug/$workflowSlug/'
      preLoaderRoute: typeof LayoutProjectSlugWorkflowSlugLayoutIndexImport
      parentRoute: typeof LayoutProjectSlugWorkflowSlugLayoutImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  LayoutRoute: LayoutRoute.addChildren({
    LayoutExploreRoute,
    LayoutIndexRoute,
    LayoutProjectSlugIndexRoute,
    LayoutProjectSlugWorkflowSlugRoute:
      LayoutProjectSlugWorkflowSlugRoute.addChildren({
        LayoutProjectSlugWorkflowSlugLayoutRoute:
          LayoutProjectSlugWorkflowSlugLayoutRoute.addChildren({
            LayoutProjectSlugWorkflowSlugLayoutApiRoute,
            LayoutProjectSlugWorkflowSlugLayoutVersionsRoute,
            LayoutProjectSlugWorkflowSlugLayoutIndexRoute,
          }),
        LayoutProjectSlugWorkflowSlugVVersionRoute,
      }),
  }),
  LoginRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_layout",
        "/login"
      ]
    },
    "/_layout": {
      "filePath": "_layout.tsx",
      "children": [
        "/_layout/explore",
        "/_layout/",
        "/_layout/$projectSlug/",
        "/_layout/$projectSlug/$workflowSlug"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/_layout/explore": {
      "filePath": "_layout.explore.tsx",
      "parent": "/_layout"
    },
    "/_layout/": {
      "filePath": "_layout.index.tsx",
      "parent": "/_layout"
    },
    "/_layout/$projectSlug/": {
      "filePath": "_layout.$projectSlug/index.tsx",
      "parent": "/_layout"
    },
    "/_layout/$projectSlug/$workflowSlug": {
      "filePath": "_layout.$projectSlug/$workflowSlug",
      "parent": "/_layout",
      "children": [
        "/_layout/$projectSlug/$workflowSlug/_layout",
        "/_layout/$projectSlug/$workflowSlug/v/$version"
      ]
    },
    "/_layout/$projectSlug/$workflowSlug/_layout": {
      "filePath": "_layout.$projectSlug/$workflowSlug/_layout.tsx",
      "parent": "/_layout/$projectSlug/$workflowSlug",
      "children": [
        "/_layout/$projectSlug/$workflowSlug/_layout/api",
        "/_layout/$projectSlug/$workflowSlug/_layout/versions",
        "/_layout/$projectSlug/$workflowSlug/_layout/"
      ]
    },
    "/_layout/$projectSlug/$workflowSlug/_layout/api": {
      "filePath": "_layout.$projectSlug/$workflowSlug/_layout.api.tsx",
      "parent": "/_layout/$projectSlug/$workflowSlug/_layout"
    },
    "/_layout/$projectSlug/$workflowSlug/_layout/versions": {
      "filePath": "_layout.$projectSlug/$workflowSlug/_layout.versions.tsx",
      "parent": "/_layout/$projectSlug/$workflowSlug/_layout"
    },
    "/_layout/$projectSlug/$workflowSlug/v/$version": {
      "filePath": "_layout.$projectSlug/$workflowSlug.v.$version.tsx",
      "parent": "/_layout/$projectSlug/$workflowSlug"
    },
    "/_layout/$projectSlug/$workflowSlug/_layout/": {
      "filePath": "_layout.$projectSlug/$workflowSlug/_layout.index.tsx",
      "parent": "/_layout/$projectSlug/$workflowSlug/_layout"
    }
  }
}
ROUTE_MANIFEST_END */
