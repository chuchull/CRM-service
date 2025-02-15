import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PSBlock from './PSBlock';
import '../index.css';

export default function Layout() {
  return (
    <div className="main-con">
      <div className="left-con">
        <Sidebar />
      </div>
      <div className="right-con">
        <Navbar />
        <div className="layout-body">
          <div className="layout-content">
            <Outlet />
          </div>
          <PSBlock />
        </div>
      </div>
    </div>
  );
}