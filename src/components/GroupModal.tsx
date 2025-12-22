import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Group } from '@/contexts/GroupsContext';

interface GroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (group: Omit<Group, 'id' | 'members' | 'isJoined'>) => void;
  editGroup?: Group | null;
}

const GroupModal = ({ open, onClose, onSubmit, editGroup }: GroupModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (editGroup) {
      setName(editGroup.name);
      setDescription(editGroup.description);
      setCategory(editGroup.category);
    } else {
      setName('');
      setDescription('');
      setCategory('');
    }
  }, [editGroup, open]);

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !category) {
      return;
    }
    
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      category,
      isPrivate: false, // Always public
      avatar: editGroup?.avatar,
    });
    
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editGroup ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-base font-medium">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g., Tech Alumni Network"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description" className="text-base font-medium">Description</Label>
            <Textarea
              id="group-description"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-category" className="text-base font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="group-category" className="h-11">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Location">Location</SelectItem>
                <SelectItem value="Class Year">Class Year</SelectItem>
                <SelectItem value="Career">Career</SelectItem>
                <SelectItem value="Hobby">Hobby</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !description.trim() || !category}
              className="flex-1 h-11"
            >
              {editGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;

