import { createUniqueId, type Component, createSignal, JSX } from "solid-js";
import { useNavigate, useRouteData } from "@solidjs/router";

import { useApiClient } from "../../api";

import styles from "./Login.module.css";
import { Field } from "../../components/Field";

export const Login: Component = () => {
  const api = useApiClient();
  const navigate = useNavigate();
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");

  const handleUsernameInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    setUsername(event.currentTarget.value);
  };

  const handlePasswordInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    setPassword(event.currentTarget.value);
  };

  const handleSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent> = async (ev) => {
    ev.preventDefault();

    try {
      await api.login(username(), password());
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      if (redirect) {
        navigate(redirect);
      } else {
        navigate("/");
      }
    } catch (e) {
      alert("Failed to login: " + e);
    }
  };

  return (
    <form class={styles.Login} onSubmit={handleSubmit}>
      <Field label="Username">
        {(id) => <input type="text" id={id} onInput={handleUsernameInput} />}
      </Field>
      <Field label="Password">
        {(id) => <input type="password" id={id} onInput={handlePasswordInput} />}
      </Field>
      <input type="submit" class="button primary" value="Log In" />
    </form>
  );
};