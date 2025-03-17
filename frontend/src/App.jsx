import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Modules from './pages/Modules';
import Record from './pages/Record';
import CreateRecord from './pages/cud/CreateRecord';
import Layout from './layout/Layout';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="modules/:moduleId" element={<Modules />} />
          <Route path="modules/:module/record/:recordId" element={<Record />} />
          <Route path="modules/:module/create" element={<CreateRecord />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;