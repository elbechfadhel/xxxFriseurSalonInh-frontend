import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
    children: JSX.Element;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
