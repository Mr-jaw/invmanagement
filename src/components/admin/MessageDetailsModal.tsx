import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, Mail, Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Contact | null;
  onMessageUpdate: (updatedMessage: Contact) => void;
  onMessageDelete: (messageId: string) => void;
}

export const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  isOpen,
  onClose,
  message,
  onMessageUpdate,
  onMessageDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Close modal on ESC key press
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const logAdminAction = async (actionType: string, contactId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_actions')
        .insert([{
          action_type: actionType,
          contact_id: contactId,
          admin_email: user.email,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const toggleReadStatus = async () => {
    if (!message) return;
    
    setLoading(true);
    try {
      const newReadStatus = !message.read;
      const readAt = newReadStatus ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('contacts')
        .update({ 
          read: newReadStatus, 
          read_at: readAt 
        })
        .eq('id', message.id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction(newReadStatus ? 'mark_read' : 'mark_unread', message.id);
      
      // Update the message in parent component
      const updatedMessage = {
        ...message,
        read: newReadStatus,
        read_at: readAt || undefined
      };
      
      onMessageUpdate(updatedMessage);
      
      // Show success feedback
      console.log(`Message marked as ${newReadStatus ? 'read' : 'unread'} successfully`);
    } catch (error) {
      console.error('Error updating message status:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async () => {
    if (!message) return;
    
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('delete_message', message.id);
      
      // Notify parent component
      onMessageDelete(message.id);
      
      // Close modal
      onClose();
      
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReplyViaEmail = () => {
    if (!message) return;
    
    const subject = `Re: ${message.subject}`;
    const body = `Hi ${message.name},\n\nThank you for contacting us regarding "${message.subject}".\n\n\n\nBest regards,\nLuxeShowcase Team`;
    const mailtoUrl = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;
  };

  if (!isOpen || !message) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Message Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      From {message.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Status Badge */}
                  {message.read ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Read
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <Mail className="h-3 w-3 mr-1" />
                      Unread
                    </span>
                  )}
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    icon={X}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Message Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sender Name
                    </label>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {message.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email Address
                    </label>
                    <p className="text-base text-gray-900 dark:text-white">
                      {message.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Message Status
                    </label>
                    <p className="text-base text-gray-900 dark:text-white">
                      {message.read ? 'Read' : 'Unread'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category/Type
                    </label>
                    <p className="text-base text-gray-900 dark:text-white">
                      {message.subject.includes('Product Inquiry') ? 'Product Inquiry' : 'General Contact'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Subject/Title
                </label>
                <Card className="p-4 bg-gray-50 dark:bg-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {message.subject}
                  </h4>
                </Card>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Received
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {new Date(message.created_at).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {message.read && message.read_at && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Read
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {new Date(message.read_at).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 block">
                  Full Message Content
                </label>
                <Card className="p-6 bg-gray-50 dark:bg-gray-700 border-l-4 border-l-primary-500">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex space-x-3">
                  <Button
                    onClick={handleReplyViaEmail}
                    icon={Mail}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Reply via Email
                  </Button>
                  
                  <Button
                    onClick={toggleReadStatus}
                    loading={loading}
                    variant="outline"
                    icon={message.read ? Mail : CheckCircle}
                    className={message.read ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
                  >
                    Mark as {message.read ? 'Unread' : 'Read'}
                  </Button>
                </div>
                
                <Button
                  onClick={deleteMessage}
                  loading={deleteLoading}
                  variant="danger"
                  icon={Trash2}
                  className="sm:ml-3"
                >
                  Delete Message
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  {message.read 
                    ? 'This message has been read and is visible in your read messages list.'
                    : 'This message is unread and will appear in your unread messages list until marked as read.'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};