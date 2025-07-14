import Homepage from '@/components/homepage';
import Resume from '@/components/resume';
import Job from '@/components/job';
import Entrance from '@/components/entrance';
import Interview from '@/components/interview';
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Homepage />,
  },
  {
    path: '/resume',
    element: <Resume />,
  },
  {
    path: '/entrance',
    element: <Entrance />,
  },
  {
    path: '/job',
    element: <Job />,
  },
  {
    path: '/interview',
    element: <Interview />,
  }
])