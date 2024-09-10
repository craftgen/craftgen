/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as UsersImport } from './routes/users'
import { Route as RedirectImport } from './routes/redirect'
import { Route as PostsImport } from './routes/posts'
import { Route as DeferredImport } from './routes/deferred'
import { Route as PublicImport } from './routes/_public'
import { Route as UsersIndexImport } from './routes/users.index'
import { Route as PostsIndexImport } from './routes/posts.index'
import { Route as PublicIndexImport } from './routes/_public/index'
import { Route as UsersUserIdImport } from './routes/users.$userId'
import { Route as PostsPostIdImport } from './routes/posts.$postId'
import { Route as PublicLayout2Import } from './routes/_public/_layout-2'
import { Route as PostsPostIdDeepImport } from './routes/posts_.$postId.deep'
import { Route as PublicLayout2LayoutBImport } from './routes/_public/_layout-2/layout-b'
import { Route as PublicLayout2LayoutAImport } from './routes/_public/_layout-2/layout-a'

// Create/Update Routes

const UsersRoute = UsersImport.update({
  path: '/users',
  getParentRoute: () => rootRoute,
} as any)

const RedirectRoute = RedirectImport.update({
  path: '/redirect',
  getParentRoute: () => rootRoute,
} as any)

const PostsRoute = PostsImport.update({
  path: '/posts',
  getParentRoute: () => rootRoute,
} as any)

const DeferredRoute = DeferredImport.update({
  path: '/deferred',
  getParentRoute: () => rootRoute,
} as any)

const PublicRoute = PublicImport.update({
  id: '/_public',
  getParentRoute: () => rootRoute,
} as any)

const UsersIndexRoute = UsersIndexImport.update({
  path: '/',
  getParentRoute: () => UsersRoute,
} as any)

const PostsIndexRoute = PostsIndexImport.update({
  path: '/',
  getParentRoute: () => PostsRoute,
} as any)

const PublicIndexRoute = PublicIndexImport.update({
  path: '/',
  getParentRoute: () => PublicRoute,
} as any)

const UsersUserIdRoute = UsersUserIdImport.update({
  path: '/$userId',
  getParentRoute: () => UsersRoute,
} as any)

const PostsPostIdRoute = PostsPostIdImport.update({
  path: '/$postId',
  getParentRoute: () => PostsRoute,
} as any)

const PublicLayout2Route = PublicLayout2Import.update({
  id: '/_layout-2',
  getParentRoute: () => PublicRoute,
} as any)

const PostsPostIdDeepRoute = PostsPostIdDeepImport.update({
  path: '/posts/$postId/deep',
  getParentRoute: () => rootRoute,
} as any)

const PublicLayout2LayoutBRoute = PublicLayout2LayoutBImport.update({
  path: '/layout-b',
  getParentRoute: () => PublicLayout2Route,
} as any)

const PublicLayout2LayoutARoute = PublicLayout2LayoutAImport.update({
  path: '/layout-a',
  getParentRoute: () => PublicLayout2Route,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_public': {
      id: '/_public'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof PublicImport
      parentRoute: typeof rootRoute
    }
    '/deferred': {
      id: '/deferred'
      path: '/deferred'
      fullPath: '/deferred'
      preLoaderRoute: typeof DeferredImport
      parentRoute: typeof rootRoute
    }
    '/posts': {
      id: '/posts'
      path: '/posts'
      fullPath: '/posts'
      preLoaderRoute: typeof PostsImport
      parentRoute: typeof rootRoute
    }
    '/redirect': {
      id: '/redirect'
      path: '/redirect'
      fullPath: '/redirect'
      preLoaderRoute: typeof RedirectImport
      parentRoute: typeof rootRoute
    }
    '/users': {
      id: '/users'
      path: '/users'
      fullPath: '/users'
      preLoaderRoute: typeof UsersImport
      parentRoute: typeof rootRoute
    }
    '/_public/_layout-2': {
      id: '/_public/_layout-2'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof PublicLayout2Import
      parentRoute: typeof PublicImport
    }
    '/posts/$postId': {
      id: '/posts/$postId'
      path: '/$postId'
      fullPath: '/posts/$postId'
      preLoaderRoute: typeof PostsPostIdImport
      parentRoute: typeof PostsImport
    }
    '/users/$userId': {
      id: '/users/$userId'
      path: '/$userId'
      fullPath: '/users/$userId'
      preLoaderRoute: typeof UsersUserIdImport
      parentRoute: typeof UsersImport
    }
    '/_public/': {
      id: '/_public/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof PublicIndexImport
      parentRoute: typeof PublicImport
    }
    '/posts/': {
      id: '/posts/'
      path: '/'
      fullPath: '/posts/'
      preLoaderRoute: typeof PostsIndexImport
      parentRoute: typeof PostsImport
    }
    '/users/': {
      id: '/users/'
      path: '/'
      fullPath: '/users/'
      preLoaderRoute: typeof UsersIndexImport
      parentRoute: typeof UsersImport
    }
    '/_public/_layout-2/layout-a': {
      id: '/_public/_layout-2/layout-a'
      path: '/layout-a'
      fullPath: '/layout-a'
      preLoaderRoute: typeof PublicLayout2LayoutAImport
      parentRoute: typeof PublicLayout2Import
    }
    '/_public/_layout-2/layout-b': {
      id: '/_public/_layout-2/layout-b'
      path: '/layout-b'
      fullPath: '/layout-b'
      preLoaderRoute: typeof PublicLayout2LayoutBImport
      parentRoute: typeof PublicLayout2Import
    }
    '/posts/$postId/deep': {
      id: '/posts/$postId/deep'
      path: '/posts/$postId/deep'
      fullPath: '/posts/$postId/deep'
      preLoaderRoute: typeof PostsPostIdDeepImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface PublicLayout2RouteChildren {
  PublicLayout2LayoutARoute: typeof PublicLayout2LayoutARoute
  PublicLayout2LayoutBRoute: typeof PublicLayout2LayoutBRoute
}

const PublicLayout2RouteChildren: PublicLayout2RouteChildren = {
  PublicLayout2LayoutARoute: PublicLayout2LayoutARoute,
  PublicLayout2LayoutBRoute: PublicLayout2LayoutBRoute,
}

const PublicLayout2RouteWithChildren = PublicLayout2Route._addFileChildren(
  PublicLayout2RouteChildren,
)

interface PublicRouteChildren {
  PublicLayout2Route: typeof PublicLayout2RouteWithChildren
  PublicIndexRoute: typeof PublicIndexRoute
}

const PublicRouteChildren: PublicRouteChildren = {
  PublicLayout2Route: PublicLayout2RouteWithChildren,
  PublicIndexRoute: PublicIndexRoute,
}

const PublicRouteWithChildren =
  PublicRoute._addFileChildren(PublicRouteChildren)

interface PostsRouteChildren {
  PostsPostIdRoute: typeof PostsPostIdRoute
  PostsIndexRoute: typeof PostsIndexRoute
}

const PostsRouteChildren: PostsRouteChildren = {
  PostsPostIdRoute: PostsPostIdRoute,
  PostsIndexRoute: PostsIndexRoute,
}

const PostsRouteWithChildren = PostsRoute._addFileChildren(PostsRouteChildren)

interface UsersRouteChildren {
  UsersUserIdRoute: typeof UsersUserIdRoute
  UsersIndexRoute: typeof UsersIndexRoute
}

const UsersRouteChildren: UsersRouteChildren = {
  UsersUserIdRoute: UsersUserIdRoute,
  UsersIndexRoute: UsersIndexRoute,
}

const UsersRouteWithChildren = UsersRoute._addFileChildren(UsersRouteChildren)

export interface FileRoutesByFullPath {
  '': typeof PublicLayout2RouteWithChildren
  '/deferred': typeof DeferredRoute
  '/posts': typeof PostsRouteWithChildren
  '/redirect': typeof RedirectRoute
  '/users': typeof UsersRouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/users/$userId': typeof UsersUserIdRoute
  '/': typeof PublicIndexRoute
  '/posts/': typeof PostsIndexRoute
  '/users/': typeof UsersIndexRoute
  '/layout-a': typeof PublicLayout2LayoutARoute
  '/layout-b': typeof PublicLayout2LayoutBRoute
  '/posts/$postId/deep': typeof PostsPostIdDeepRoute
}

export interface FileRoutesByTo {
  '/deferred': typeof DeferredRoute
  '/redirect': typeof RedirectRoute
  '': typeof PublicLayout2RouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/users/$userId': typeof UsersUserIdRoute
  '/': typeof PublicIndexRoute
  '/posts': typeof PostsIndexRoute
  '/users': typeof UsersIndexRoute
  '/layout-a': typeof PublicLayout2LayoutARoute
  '/layout-b': typeof PublicLayout2LayoutBRoute
  '/posts/$postId/deep': typeof PostsPostIdDeepRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/_public': typeof PublicRouteWithChildren
  '/deferred': typeof DeferredRoute
  '/posts': typeof PostsRouteWithChildren
  '/redirect': typeof RedirectRoute
  '/users': typeof UsersRouteWithChildren
  '/_public/_layout-2': typeof PublicLayout2RouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/users/$userId': typeof UsersUserIdRoute
  '/_public/': typeof PublicIndexRoute
  '/posts/': typeof PostsIndexRoute
  '/users/': typeof UsersIndexRoute
  '/_public/_layout-2/layout-a': typeof PublicLayout2LayoutARoute
  '/_public/_layout-2/layout-b': typeof PublicLayout2LayoutBRoute
  '/posts/$postId/deep': typeof PostsPostIdDeepRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | ''
    | '/deferred'
    | '/posts'
    | '/redirect'
    | '/users'
    | '/posts/$postId'
    | '/users/$userId'
    | '/'
    | '/posts/'
    | '/users/'
    | '/layout-a'
    | '/layout-b'
    | '/posts/$postId/deep'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/deferred'
    | '/redirect'
    | ''
    | '/posts/$postId'
    | '/users/$userId'
    | '/'
    | '/posts'
    | '/users'
    | '/layout-a'
    | '/layout-b'
    | '/posts/$postId/deep'
  id:
    | '__root__'
    | '/_public'
    | '/deferred'
    | '/posts'
    | '/redirect'
    | '/users'
    | '/_public/_layout-2'
    | '/posts/$postId'
    | '/users/$userId'
    | '/_public/'
    | '/posts/'
    | '/users/'
    | '/_public/_layout-2/layout-a'
    | '/_public/_layout-2/layout-b'
    | '/posts/$postId/deep'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  PublicRoute: typeof PublicRouteWithChildren
  DeferredRoute: typeof DeferredRoute
  PostsRoute: typeof PostsRouteWithChildren
  RedirectRoute: typeof RedirectRoute
  UsersRoute: typeof UsersRouteWithChildren
  PostsPostIdDeepRoute: typeof PostsPostIdDeepRoute
}

const rootRouteChildren: RootRouteChildren = {
  PublicRoute: PublicRouteWithChildren,
  DeferredRoute: DeferredRoute,
  PostsRoute: PostsRouteWithChildren,
  RedirectRoute: RedirectRoute,
  UsersRoute: UsersRouteWithChildren,
  PostsPostIdDeepRoute: PostsPostIdDeepRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_public",
        "/deferred",
        "/posts",
        "/redirect",
        "/users",
        "/posts/$postId/deep"
      ]
    },
    "/_public": {
      "filePath": "_public.tsx",
      "children": [
        "/_public/_layout-2",
        "/_public/"
      ]
    },
    "/deferred": {
      "filePath": "deferred.tsx"
    },
    "/posts": {
      "filePath": "posts.tsx",
      "children": [
        "/posts/$postId",
        "/posts/"
      ]
    },
    "/redirect": {
      "filePath": "redirect.tsx"
    },
    "/users": {
      "filePath": "users.tsx",
      "children": [
        "/users/$userId",
        "/users/"
      ]
    },
    "/_public/_layout-2": {
      "filePath": "_public/_layout-2.tsx",
      "parent": "/_public",
      "children": [
        "/_public/_layout-2/layout-a",
        "/_public/_layout-2/layout-b"
      ]
    },
    "/posts/$postId": {
      "filePath": "posts.$postId.tsx",
      "parent": "/posts"
    },
    "/users/$userId": {
      "filePath": "users.$userId.tsx",
      "parent": "/users"
    },
    "/_public/": {
      "filePath": "_public/index.tsx",
      "parent": "/_public"
    },
    "/posts/": {
      "filePath": "posts.index.tsx",
      "parent": "/posts"
    },
    "/users/": {
      "filePath": "users.index.tsx",
      "parent": "/users"
    },
    "/_public/_layout-2/layout-a": {
      "filePath": "_public/_layout-2/layout-a.tsx",
      "parent": "/_public/_layout-2"
    },
    "/_public/_layout-2/layout-b": {
      "filePath": "_public/_layout-2/layout-b.tsx",
      "parent": "/_public/_layout-2"
    },
    "/posts/$postId/deep": {
      "filePath": "posts_.$postId.deep.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
