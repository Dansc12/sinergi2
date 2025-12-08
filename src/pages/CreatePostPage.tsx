import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreatePostPage = () => {
  const navigate = useNavigate();

  // Immediately redirect to share screen for posts
  useEffect(() => {
    navigate("/share", {
      state: {
        contentType: "post",
        contentData: {},
        images: [],
        returnTo: "/",
      },
      replace: true,
    });
  }, [navigate]);

  return null;
};

export default CreatePostPage;
