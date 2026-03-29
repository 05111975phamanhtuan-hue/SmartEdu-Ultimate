// src/App.js - Thêm kiểm tra điều khoản
const App = () => {
  const { user, api } = useAuth();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsStatus, setTermsStatus] = useState(null);
  
  useEffect(() => {
    if (user) {
      checkTermsStatus();
    }
  }, [user]);
  
  const checkTermsStatus = async () => {
    try {
      const response = await api.get('/terms/status');
      setTermsStatus(response.data);
      if (!response.data.hasAgreed) {
        setShowTermsModal(true);
      }
    } catch (err) {}
  };
  
  const handleTermsAgree = () => {
    setShowTermsModal(false);
    setTermsStatus({ ...termsStatus, hasAgreed: true });
  };
  
  return (
    <>
      {/* Existing app content */}
      {showTermsModal && (
        <TermsModal onAgree={handleTermsAgree} onClose={() => window.location.href = '/logout'} />
      )}
    </>
  );
};