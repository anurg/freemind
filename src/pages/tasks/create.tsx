import React from 'react';
import Layout from '../../components/Layout';
import TaskForm from '../../components/TaskForm';
import withAuth from '../../utils/withAuth';

const CreateTaskPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
        <TaskForm />
      </div>
    </Layout>
  );
};

export default withAuth(CreateTaskPage);
