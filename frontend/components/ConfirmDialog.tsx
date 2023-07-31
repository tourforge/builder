import styles from "styles/ConfirmDialog.module.css";

export default function ConfirmDialog({ closeDialog, title, text, action }: {
  closeDialog: (confirmed: boolean) => void,
  title: string,
  text: string,
  action: string,
}) {
  return (
    <div className={styles.ConfirmDialog}>
      <header className={styles.header}>{title}</header>
      <div style={{ height: "8px" }}></div>
      {text}
      <div style={{ height: "16px" }}></div>
      <div className={styles.buttons}>
        <button onClick={() => closeDialog(false)} className="secondary">Cancel</button>
        <button onClick={() => closeDialog(true)} className="danger">{action}</button>
      </div>
    </div>
  );
}
