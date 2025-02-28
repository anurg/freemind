import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import UserForm from '../../components/UserForm';
import withAuth from '../../utils/withAuth';
import { ArrowLeft } from 'lucide-react';

const EditUserPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/users');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        </div>
        
        <UserForm userId={id as string} />
      </div>
    </Layout>
  );
};

export default withAuth(EditUserPage, ['ADMIN']);
