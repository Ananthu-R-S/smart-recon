import { useState } from "react";
import axios from "axios";

export default function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const res = await axios.post(
        "http://localhost:4000/api/auth/login",
        { username, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("token", res.data.name);
      localStorage.setItem("role", res.data.role);

      window.location.href = "/dashboard";

    } catch (err) {

      alert("Invalid username or password");

    }

  };

  return (
    <div style={{ width: "300px", margin: "120px auto", textAlign: "center" }}>

      <h3>Login</h3>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <button
        onClick={handleLogin}
        style={{ width: "100%", padding: "8px" }}
      >
        Login
      </button>

    </div>
  );
}