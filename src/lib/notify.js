export async function showSuccess(message) {
  try {
    // Ensure CSS is loaded (Vite supports importing CSS from JS)
    try {
      await import('sweetalert2/dist/sweetalert2.min.css');
    } catch (cssErr) {
      // ignore CSS import failures; toast may still render but look unstyled
      console.warn('Failed to load SweetAlert2 CSS', cssErr);
    }
    const module = await import('sweetalert2');
    const Swal = module.default || module;
    return Swal.fire({
      toast: true,
      position: 'top-start', // top-left (start) to appear under navbar on left
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
      background: '#0f172a',
      color: '#fff'
    });
  } catch (e) {
    // final fallback to native alert
    // eslint-disable-next-line no-alert
    alert(message);
    return Promise.resolve();
  }
}

export async function showError(message) {
  try {
    try {
      await import('sweetalert2/dist/sweetalert2.min.css');
    } catch (cssErr) {
      console.warn('Failed to load SweetAlert2 CSS', cssErr);
    }
    const module = await import('sweetalert2');
    const Swal = module.default || module;
    return Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
    });
  } catch (e) {
    // eslint-disable-next-line no-alert
    alert(message);
    return Promise.resolve();
  }
}
