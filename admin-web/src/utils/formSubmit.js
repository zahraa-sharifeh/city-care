/**
 * Wrap a form submit handler so the browser never performs a full-page POST/navigation.
 * @param {(event: React.FormEvent<HTMLFormElement>) => void | Promise<void>} handler
 */
export function handleFormSubmit(handler) {
  return function onFormSubmit(event) {
    event.preventDefault();
    return handler(event);
  };
}
