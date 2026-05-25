/**
 * Shared interface for wizard step component imperative handles.
 * Every step component exposes this via React.forwardRef + useImperativeHandle
 * so the wizard shell can call validate() before advancing.
 */
export interface StepRef {
  /** Validates the step's input fields. Returns true if all fields are valid. */
  validate: () => boolean;
}
