import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const errorText = document.getElementById('error-text');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
    });

    if (error) {
        errorText.innerText = "E-mail ou senha incorretos!";
        errorText.style.display = 'block';
        document.getElementById('password').value = '';
    } else {
        window.location.href = 'admin.html';
    }
});

// Limpa erro ao digitar
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        errorText.style.display = 'none';
    });
});
