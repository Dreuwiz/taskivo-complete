import { Modal } from "../ui/Modal";

export function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirm Action" onClose={onClose} onSubmit={onConfirm} submitLabel="Delete" submitColor="#c0392b">
      <p style={{ margin:0, fontSize:15, color:"#555", lineHeight:1.6 }}>{message}</p>
    </Modal>
  );
}
