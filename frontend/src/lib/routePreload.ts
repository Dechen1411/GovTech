export const pageLoaders = {
  adminDashboard: () => import("@/pages/AdminDashboard"),
  notFound: () => import("@/pages/NotFound"),
  userDashboard: () => import("@/pages/UserDashboard"),
};

type PageKey = keyof typeof pageLoaders;

const pagePreloads = new Map<PageKey, Promise<unknown>>();

export const preloadPage = (page: PageKey) => {
  if (!pagePreloads.has(page)) {
    pagePreloads.set(page, pageLoaders[page]());
  }

  return pagePreloads.get(page);
};
