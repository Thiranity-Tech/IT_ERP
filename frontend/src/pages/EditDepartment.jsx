import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function EditDepartment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");

  useEffect(() => {
    api
      .get(`/departments/${id}`)
      .then((res) => {
        setName(res.data.name);
      })
      .catch((err) => console.error(err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/departments/${id}`, {
        name,
      });

      alert("Department updated successfully");
      navigate("/departments");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update department");
    }
  };

  return (
    <Layout>
      <h1>Rename Department</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <br />
        <br />

        <button type="submit">
          Update Department
        </button>
      </form>
    </Layout>
  );
}

export default EditDepartment;
