import { useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

function CreateDepartment() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/departments", {
        name,
      });

      alert("Department created successfully");
      navigate("/departments");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create department");
    }
  };

  return (
    <Layout>
      <h1>Create Department</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">
          Create Department
        </button>
      </form>
    </Layout>
  );
}

export default CreateDepartment;
