import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from './HomePage';
import { NotFound } from './NotFound';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'images-to-pdf',
        lazy: async () => ({ Component: (await import('../tools/images-to-pdf/ImagesToPdfPage')).default }),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
