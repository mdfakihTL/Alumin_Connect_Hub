import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Upload, Mail, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface AlumniUser {
  id: string;
  name: string;
  email: string;
  graduationYear: string;
  major: string;
  isMentor: boolean;
  universityId: string;
}

const AdminUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  
  // Single user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    graduationYear: '',
    major: '',
    isMentor: false,
  });

  const handleAddSingleUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Create user object
    const alumniUser: AlumniUser = {
      id: `user_${Date.now()}`,
      ...newUser,
      universityId: user?.universityId || '',
    };

    // Store in localStorage
    const existingUsers = JSON.parse(localStorage.getItem(`alumni_users_${user?.universityId}`) || '[]');
    existingUsers.push(alumniUser);
    localStorage.setItem(`alumni_users_${user?.universityId}`, JSON.stringify(existingUsers));

    // Simulate sending credentials email
    toast({
      title: 'User added successfully!',
      description: `Credentials sent to ${newUser.email}`,
    });

    // Reset form
    setNewUser({
      name: '',
      email: '',
      graduationYear: '',
      major: '',
      isMentor: false,
    });
    setIsAddDialogOpen(false);
  };

  const handleBulkUpload = () => {
    if (!bulkData.trim()) {
      toast({
        title: 'No data provided',
        description: 'Please paste CSV data to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Parse CSV (simple implementation)
      const lines = bulkData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['name', 'email'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        toast({
          title: 'Invalid CSV format',
          description: 'CSV must include: name, email (optional: graduationYear, major, isMentor)',
          variant: 'destructive',
        });
        return;
      }

      const users: AlumniUser[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === 0 || !values[0]) continue;

        const userData: any = {};
        headers.forEach((header, index) => {
          userData[header] = values[index] || '';
        });

        users.push({
          id: `user_${Date.now()}_${i}`,
          name: userData.name,
          email: userData.email,
          graduationYear: userData.graduationyear || userData.year || '',
          major: userData.major || '',
          isMentor: userData.ismentor === 'true' || userData.ismentor === '1',
          universityId: user?.universityId || '',
        });
      }

      // Store users
      const existingUsers = JSON.parse(localStorage.getItem(`alumni_users_${user?.universityId}`) || '[]');
      const updatedUsers = [...existingUsers, ...users];
      localStorage.setItem(`alumni_users_${user?.universityId}`, JSON.stringify(updatedUsers));

      toast({
        title: 'Bulk upload successful!',
        description: `Added ${users.length} users. Credentials sent to their emails.`,
      });

      setBulkData('');
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Please check your CSV format and try again',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    const template = 'name,email,graduationYear,major,isMentor\nJohn Doe,john@example.com,2020,Computer Science,false\nJane Smith,jane@example.com,2019,Engineering,true';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Add alumni individually or in bulk
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Alumni
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Alumni</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Graduation Year</Label>
                  <Input
                    id="year"
                    placeholder="2020"
                    value={newUser.graduationYear}
                    onChange={(e) => setNewUser({ ...newUser, graduationYear: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    value={newUser.major}
                    onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentor">Is Mentor?</Label>
                  <Switch
                    id="mentor"
                    checked={newUser.isMentor}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, isMentor: checked })}
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Login credentials will be automatically sent to the provided email address.
                  </p>
                </div>
                <Button onClick={handleAddSingleUser} className="w-full">
                  Add Alumni
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="bulk" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CSV Data</Label>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <Textarea
                placeholder="name,email,graduationYear,major,isMentor&#10;John Doe,john@example.com,2020,Computer Science,false&#10;Jane Smith,jane@example.com,2019,Engineering,true"
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleBulkUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload Alumni
            </Button>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium mb-2">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>First line must contain headers</li>
                      <li>Required columns: name, email</li>
                      <li>Optional columns: graduationYear, major, isMentor</li>
                      <li>Use comma to separate values</li>
                      <li>Use 'true' or 'false' for isMentor field</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-600 dark:text-green-400">
                    <p className="font-medium mb-2">Example CSV:</p>
                    <pre className="bg-card p-3 rounded border border-border mt-2 overflow-x-auto">
{`name,email,graduationYear,major,isMentor
John Doe,john@example.com,2020,Computer Science,false
Jane Smith,jane@example.com,2019,Engineering,true
Bob Johnson,bob@example.com,2021,Business,false`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    <p className="font-medium mb-2">Automatic Email Notifications:</p>
                    <p>
                      Each user will receive an email with their login credentials and a welcome message 
                      to join the {user?.university} alumni network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminUserManagement;

