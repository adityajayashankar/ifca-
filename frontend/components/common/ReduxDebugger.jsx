import { useSelector } from 'react-redux';
import { selectUser } from '../../store/features/userSlice';

const ReduxDebugger = () => {
  const user = useSelector(selectUser);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      wordBreak: 'break-all'
    }}>
      <div><strong>Redux User State:</strong></div>
      <div>User: {user ? '✅ Set' : '❌ Not Set'}</div>
      {user && (
        <div>
          <div>ID: {user.id}</div>
          <div>Type: {user.userType}</div>
          <div>Email: {user.email}</div>
        </div>
      )}
    </div>
  );
};

export default ReduxDebugger; 