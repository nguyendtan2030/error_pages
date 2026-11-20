/** The path every Meoz Labs product takes, drawn as a diagram. */
export const PROCESS_STEPS: readonly string[] = ['Idea', 'Prototype', 'Build', 'Ship', 'Run'];

export interface Pillar {
  title: string;
  body: string;
  icon: 'solutions' | 'ideas' | 'web' | 'production';
}

/** How Meoz Labs works, from the original mission statement. */
export const PILLARS: readonly Pillar[] = [
  {
    title: 'Crafting digital solutions',
    body: 'We design and build end-to-end products, from scalable backend services to modern web interfaces.',
    icon: 'solutions',
  },
  {
    title: 'Exploring bold ideas',
    body: 'Ideas start as small experiments: we prototype fast, learn from real use and keep what works.',
    icon: 'ideas',
  },
  {
    title: 'Pushing web development',
    body: 'Modern frameworks, thoughtful UX and fast, accessible experiences on every screen.',
    icon: 'web',
  },
  {
    title: 'Engineering for production',
    body: 'Clean architecture, automated delivery and our own infrastructure keep every product running.',
    icon: 'production',
  },
];

export interface Product {
  name: string;
  summary: string;
  status: 'Live' | 'In development';
  url?: string;
}

/** Products that credit Meoz Labs. Easup Charity Fund is deliberately not listed. */
export const PRODUCTS: readonly Product[] = [
  {
    name: 'PracticeCSharp',
    summary: 'A LeetCode-style platform for C#, LINQ and EF Core, graded in isolated containers.',
    status: 'Live',
    url: 'https://practice.meozlabs.com',
  },
  {
    name: 'Easup Agri',
    summary: 'GIS farm mapping and QR traceability for the farmers of Ea Sup.',
    status: 'In development',
  },
];
