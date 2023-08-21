import { createUniqueId, type Component, createSignal, JSX } from "solid-js";

import { useApiClient } from "./api";

import styles from "./Login.module.css";

export const Login: Component = () => {
  const api = useApiClient();
  const id = createUniqueId();
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");

  const handleUsernameInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    setUsername(event.currentTarget.value);
  };

  const handlePasswordInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    setPassword(event.currentTarget.value);
  };

  const handleLoginClick = async () => {
    try {
      await api.login(username(), password());
    } catch (e) {
      alert("Failed to login: " + e);
    }
  };

  return (
    <div>
      <label for={id+"-username"}>Username</label>
      <input type="text" id={id+"-username"} onInput={handleUsernameInput} />
      <label for={id+"-password"}>Password</label>
      <input type="password" id={id+"-password"} onInput={handlePasswordInput} />
      <button onClick={handleLoginClick}>Login</button>
    </div>
  );
};