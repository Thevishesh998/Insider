import { UserProfile } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const AccountPage = () => {

const navigate = useNavigate();

return (
<div className="flex flex-col items-center mt-10">

<button
onClick={()=>navigate('/')}
className="mb-6 px-4 py-2 border rounded"
>
← Back to Jobs
</button>

<UserProfile />

</div>
);
};

export default AccountPage;