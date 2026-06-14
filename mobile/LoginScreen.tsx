import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector';
        }
    }, []);

    const handleLogin = async () => {
        setErrorMsg('');
        if (!username || !password) {
            setErrorMsg('Please fill in all fields!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                navigation.replace('dashboard');
            } else {
                setErrorMsg(data.detail || 'Login failed!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🦷 Gingivitis Detector</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                testID="login-username"
                accessibilityLabel="login-username"
                id="email"
                type="email"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="login-password"
                accessibilityLabel="login-password"
                id="password"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    testID="login-button"
                    accessibilityLabel="login-button"
                    id="login-button"
                >
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityLabel="go-forgot-password-link"
                id="go-forgot-password-link"
            >
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                accessibilityLabel="go-register-link"
                id="go-register-link"
            >
                <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
    input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    forgotText: { color: '#E74C3C', marginTop: 15, fontSize: 14, fontWeight: 'bold' },
    linkText: { color: '#4A90E2', marginTop: 15, fontSize: 14 },
    errorText: { color: '#E74C3C', marginBottom: 15, textAlign: 'center', fontSize: 14 },
});
