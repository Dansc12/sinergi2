import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreatePostPage = () => {
  const navigate = useNavigate();

  // Redirect to content selection screen for posts
  useEffect(() => {
    navigate("/select-content", { replace: true });
  }, [navigate]);

  return null;
};

export default CreatePostPage;
