import React from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Header from '../Header';

function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="row m-auto">
      <div className="col-auto p-0">
        <aside className="left-sidebar p-2 h-100" style={{ borderRight: '1px solid #eee' }}>
          <div className="application-brand">
            <Link to="/">
              <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0.587891 6.66479C0.587891 3.35634 3.26992 0.674316 6.57837 0.674316H22.5974C25.9059 0.674316 28.5879 3.35635 28.5879 6.6648V22.6838C28.5879 25.9923 25.9059 28.6743 22.5974 28.6743H6.57837C3.26991 28.6743 0.587891 25.9923 0.587891 22.6838V6.66479Z"
                  fill="#3E63DD"
                />
                <path
                  d="M19.2726 8.73448V10.6128C19.2726 10.6784 19.2196 10.732 19.1548 10.732H15.7763V20.6137C15.7763 20.6795 15.7232 20.733 15.6584 20.733H13.5082C13.4433 20.733 13.3903 20.6794 13.3903 20.6137V10.732H10.0202C9.95534 10.732 9.90234 10.6784 9.90234 10.6128V8.73448C9.90234 8.66895 9.95544 8.61523 10.0202 8.61523H19.1548C19.2196 8.61523 19.2726 8.66895 19.2726 8.73448Z"
                  fill="white"
                />
              </svg>
            </Link>
          </div>
          <div>
            <ul className="sidebar-inner nav nav-vertical">
              <li className="text-center mt-3 cursor-pointer">
                <Link to="/">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="4" fill={router.pathname === '/' ? '#E6EDFE' : 'none'} />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7 9C7 7.89543 7.89543 7 9 7H13C14.1046 7 15 7.89543 15 9V13C15 14.1046 14.1046 15 13 15H9C7.89543 15 7 14.1046 7 13V9ZM13 9H9V13H13V9ZM21 7C21.5523 7 22 7.44772 22 8V10H24C24.5523 10 25 10.4477 25 11C25 11.5523 24.5523 12 24 12H22V14C22 14.5523 21.5523 15 21 15C20.4477 15 20 14.5523 20 14V12H18C17.4477 12 17 11.5523 17 11C17 10.4477 17.4477 10 18 10H20V8C20 7.44772 20.4477 7 21 7ZM7 19C7 17.8954 7.89543 17 9 17H13C14.1046 17 15 17.8954 15 19V23C15 24.1046 14.1046 25 13 25H9C7.89543 25 7 24.1046 7 23V19ZM13 19H9V23H13V19ZM17 19C17 17.8954 17.8954 17 19 17H23C24.1046 17 25 17.8954 25 19V23C25 24.1046 24.1046 25 23 25H19C17.8954 25 17 24.1046 17 23V19ZM19 19V23H23V19H19Z"
                      fill={router.pathname === '/' ? '#3E63DD' : '#C1C8CD'}
                    />
                  </svg>
                </Link>
              </li>
              <li className="ext-center mt-3 cursor-pointer">
                <Link to="/tooljet-database">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10V13H13V9H10ZM10 7C9.20435 7 8.44129 7.31607 7.87868 7.87868C7.31607 8.44129 7 9.20435 7 10V16C7 16.5523 7.44772 17 8 17C8.55228 17 9 16.5523 9 16V15H13V16C13 16.5523 13.4477 17 14 17C14.5523 17 15 16.5523 15 16V15H23V22C23 22.2652 22.8946 22.5196 22.7071 22.7071C22.5196 22.8946 22.2652 23 22 23H16C15.4477 23 15 23.4477 15 24C15 24.5523 15.4477 25 16 25H22C22.7957 25 23.5587 24.6839 24.1213 24.1213C24.6839 23.5587 25 22.7957 25 22V10C25 9.20435 24.6839 8.44129 24.1213 7.87868C23.5587 7.31607 22.7957 7 22 7H10ZM15 9V13H23V10C23 9.73478 22.8946 9.48043 22.7071 9.29289C22.5196 9.10536 22.2652 9 22 9H15ZM6 20C6 18.8954 6.89543 18 8 18H12C13.1046 18 14 18.8954 14 20V24C14 25.1046 13.1046 26 12 26H8C6.89543 26 6 25.1046 6 24V20ZM8 20V24H12V20H8Z"
                      fill={router.pathname === '/tooljet-database' ? '#3E63DD' : '#C1C8CD'}
                    />
                  </svg>
                </Link>
              </li>
              <li className="text-center mt-3 cursor-pointer">
                <Link to="/organization-settings">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill={router.pathname === '/organization-settings' ? '#E6EDFE' : 'none'}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.0005 20C8.72047 20 7.65047 19.16 7.35047 17.92C7.26047 17.53 6.87047 17.3 6.47047 17.39C6.40047 17.41 6.33047 17.44 6.26047 17.48C5.17047 18.15 3.82047 17.98 2.92047 17.08C2.01047 16.17 1.85047 14.83 2.52047 13.74C2.62047 13.57 2.65047 13.38 2.60047 13.19C2.55047 13 2.44047 12.84 2.27047 12.74C2.21047 12.7 2.14047 12.67 2.06047 12.65C0.820469 12.35 -0.0195312 11.28 -0.0195312 10C-0.0195312 8.72 0.820469 7.65 2.06047 7.35C2.45047 7.26 2.69047 6.86 2.59047 6.48C2.57047 6.41 2.54047 6.34 2.50047 6.27C1.83047 5.18 1.99047 3.83 2.90047 2.93C3.81047 2.02 5.15047 1.86 6.24047 2.53C6.44047 2.65 6.68047 2.67 6.89047 2.58C7.10047 2.49 7.26047 2.31 7.32047 2.08C7.62047 0.84 8.69047 0 9.97047 0C11.2505 0 12.3105 0.84 12.6205 2.08C12.7105 2.47 13.1105 2.71 13.4905 2.61C13.5605 2.59 13.6305 2.56 13.7005 2.52C14.8005 1.85 16.1405 2.02 17.0405 2.92C17.9505 3.83 18.1105 5.17 17.4405 6.26C17.3405 6.43 17.3105 6.62 17.3505 6.81C17.3905 7 17.5105 7.16 17.6805 7.26C17.7405 7.3 17.8105 7.33 17.8905 7.34C19.1305 7.64 19.9705 8.71 19.9705 9.99C19.9705 11.27 19.1305 12.33 17.8905 12.64C17.5005 12.73 17.2605 13.13 17.3605 13.51C17.3805 13.58 17.4105 13.65 17.4505 13.72C18.1205 14.81 17.9505 16.16 17.0505 17.06C16.1505 17.96 14.8005 18.13 13.7105 17.46C13.5405 17.36 13.3505 17.33 13.1605 17.37C12.9705 17.41 12.8105 17.53 12.7105 17.7C12.6705 17.77 12.6405 17.83 12.6205 17.91C12.3205 19.15 11.2505 19.99 9.97047 19.99L10.0005 20ZM6.65047 15.37C7.88047 15.37 9.00047 16.21 9.30047 17.45C9.42047 17.96 9.87047 18 10.0005 18C10.1305 18 10.5805 17.96 10.7005 17.45C10.7705 17.17 10.8705 16.91 11.0205 16.67C11.4005 16.05 11.9905 15.61 12.7005 15.44C13.4105 15.27 14.1405 15.38 14.7605 15.76C15.2105 16.03 15.5505 15.75 15.6505 15.65C15.7405 15.56 16.0305 15.21 15.7605 14.76C15.6105 14.52 15.5005 14.26 15.4405 13.98C15.0905 12.52 15.9905 11.05 17.4405 10.69C17.9505 10.57 17.9905 10.12 17.9905 9.99C17.9905 9.86 17.9505 9.41 17.4405 9.29C17.1705 9.22 16.9105 9.12 16.6705 8.97C16.0505 8.59 15.6105 7.99 15.4405 7.29C15.2705 6.58 15.3805 5.85 15.7605 5.23C16.0305 4.78 15.7505 4.44 15.6505 4.34C15.5605 4.25 15.2105 3.96 14.7605 4.23C14.5205 4.38 14.2605 4.49 13.9805 4.55C12.5205 4.9 11.0505 4 10.6905 2.54C10.5705 2.03 10.1205 1.99 9.99047 1.99C9.86047 1.99 9.41047 2.03 9.29047 2.54C9.08047 3.39 8.50047 4.08 7.69047 4.41C6.88047 4.75 5.98047 4.68 5.23047 4.22C4.78047 3.95 4.43047 4.23 4.34047 4.33C4.25047 4.42 3.96047 4.77 4.23047 5.22C4.38047 5.46 4.49047 5.72 4.55047 6C4.90047 7.46 4.00047 8.94 2.54047 9.29C2.03047 9.41 1.99047 9.86 1.99047 9.99C1.99047 10.12 2.03047 10.57 2.54047 10.69C2.82047 10.76 3.08047 10.87 3.32047 11.01C4.60047 11.79 5.01047 13.47 4.23047 14.75C3.96047 15.2 4.24047 15.54 4.34047 15.64C4.44047 15.74 4.78047 16.02 5.23047 15.75C5.47047 15.6 5.73047 15.49 6.01047 15.43C6.22047 15.38 6.44047 15.35 6.65047 15.35V15.37Z"
                      fill="#C1C8CD"
                    />
                    <path
                      d="M10.0005 14C7.79047 14 6.00047 12.21 6.00047 10C6.00047 7.79 7.79047 6 10.0005 6C12.2105 6 14.0005 7.79 14.0005 10C14.0005 12.21 12.2105 14 10.0005 14ZM10.0005 8C8.90047 8 8.00047 8.9 8.00047 10C8.00047 11.1 8.90047 12 10.0005 12C11.1005 12 12.0005 11.1 12.0005 10C12.0005 8.9 11.1005 8 10.0005 8Z"
                      fill="#C1C8CD"
                    />
                  </svg>
                </Link>
              </li>
              <li className="m-auto">
                <NotificationCenter />
                <Profile />
              </li>
            </ul>
          </div>
        </aside>
      </div>
      <div className="col p-0">
        <Header />
        {children}
      </div>
    </div>
  );
}

export default Layout;
