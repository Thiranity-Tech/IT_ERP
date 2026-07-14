import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordInput = forwardRef(function PasswordInput(
  { className = "", ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-field ${className}`.trim()}>
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
      </button>
    </div>
  );
});

export default PasswordInput;
