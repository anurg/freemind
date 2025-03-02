import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, Plus, Save, Trash2, Edit, X } from 'lucide-react';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../hooks/useToast';
import withAuth from '../../utils/withAuth';

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const CategoriesPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'You are not authorized to access this page.',
            variant: 'destructive',
          });
          router.push('/login');
          return;
        }

        const res = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast, router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  // Save category
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You are not authorized to perform this action.',
          variant: 'destructive',
        });
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/categories/${editingId}` : '/api/categories';
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} category`);
      }

      const savedCategory = await res.json();
      
      if (editingId) {
        // Update existing category in the list
        setCategories(categories.map(cat => 
          cat.id === editingId ? savedCategory : cat
        ));
      } else {
        // Add new category to the list
        setCategories([...categories, savedCategory]);
      }
      
      resetForm();
      
      toast({
        title: 'Success',
        description: `Category ${editingId ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingId ? 'update' : 'create'} category. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You are not authorized to perform this action.',
          variant: 'destructive',
        });
        return;
      }

      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete category');
      }

      // Remove deleted category from the list
      setCategories(categories.filter(cat => cat.id !== id));
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-700">Loading categories...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </>
            )}
          </Button>
        </div>

        {/* Category Form */}
        {showForm && (
          <Card className="mb-6 bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Category' : 'Create New Category'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {editingId 
                  ? 'Update the details of an existing category.' 
                  : 'Add a new category to organize tasks.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Update' : 'Save'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No categories found. Click "Add Category" to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => handleEdit(category)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 mr-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(category.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(CategoriesPage);
