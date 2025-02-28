import React from 'react';
import Layout from '../../components/Layout';
import UserForm from '../../components/UserForm';
import withAuth from '../../utils/withAuth';

const CreateUserPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <UserForm />
      </div>
    </Layout>
  );
};

export default withAuth(CreateUserPage, ['ADMIN']);
