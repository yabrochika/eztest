import UserProfileSettings from '../../frontend/components/profile/UserProfileSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your account settings and security preferences',
};

const ProfilePage = () => {
  return <UserProfileSettings />;
};

export default ProfilePage;
