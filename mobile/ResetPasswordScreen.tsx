import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';

export default function ResetPasswordScreen({ route, navigation }: any) {
    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector - Reset Password';
        }
    }, []);
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleResetPassword = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!otp || !newPassword || !confirmPassword) {
            setErrorMsg('Please fill in all fields!');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match!');
            return;
        }
        if (newPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8000/reset-password?otp_code=${otp}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, new_password: newPassword }),
                }
            );
            const data = await response.json();
            if (response.ok) {
                setSuccessMsg('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            } else {
                setErrorMsg(data.detail || 'Failed to reset password!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔐 Reset Password</Text>
            <Text style={styles.subtitle}>
                Enter the OTP sent to{'\n'}
                <Text style={styles.email}>{email}</Text>
            </Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                testID="reset-otp"
                accessibilityLabel="reset-otp"
                id="otp"
            />

            <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                testID="reset-password"
                accessibilityLabel="reset-password"
                id="password"
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                testID="reset-confirm-password"
                accessibilityLabel="reset-confirm-password"
                id="confirm-password"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleResetPassword}
                    testID="reset-button"
                    accessibilityLabel="reset-button"
                    id="reset-button"
                >
                    <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.replace('ForgotPassword')}>
                <Text style={styles.linkText}>← Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    email: { fontWeight: 'bold', color: '#4A90E2' },
    otpInput: { width: '70%', borderWidth: 2, borderColor: '#4A90E2', borderRadius: 10, padding: 15, fontSize: 24, marginBottom: 20, letterSpacing: 10 },
    input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    linkText: { color: '#4A90E2', marginTop: 20, fontSize: 14 },
    errorText: { color: '#E74C3C', marginBottom: 15, textAlign: 'center', fontSize: 14 },
    successText: { color: '#27AE60', marginBottom: 15, textAlign: 'center', fontSize: 14 },
});
