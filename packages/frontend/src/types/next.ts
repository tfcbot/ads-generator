import { ReactNode } from "react";

// Standard NextJS 15.2.4 app router page component types
export type PageParams = {
  [key: string]: string;
};

export type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export type LayoutProps = {
  children: ReactNode;
  params: PageParams;
};

export type PageProps = {
  params: PageParams;
  searchParams?: SearchParams;
}; 