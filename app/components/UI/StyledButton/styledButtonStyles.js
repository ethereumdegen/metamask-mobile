import { StyleSheet } from 'react-native';
import { colors, fontStyles } from '../../../styles/common';

const styles = StyleSheet.create({
	container: {
		padding: 15,
		borderRadius: 4,
		justifyContent: 'center'
	},
	text: {
		fontSize: 14,
		textAlign: 'center',
		...fontStyles.bolder,
		fontWeight: 'bold'
	},
	blue: {
		backgroundColor: colors.primary
	},
	blueText: {
		color: colors.white
	},
	orange: {
		backgroundColor: colors.primaryFox
	},
	orangeText: {
		color: colors.white
	},
	infoText: {
		color: colors.primaryFox
	},
	confirm: {
		backgroundColor: colors.primary
	},
	confirmText: {
		color: colors.white
	},
	roundedNormal: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: 8
	},
	roundedNormalText: {
		color: colors.primary
	},
	normal: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.primary
	},
	normalText: {
		color: colors.primary
	},
	transparent: {
		backgroundColor: colors.white,
		borderWidth: 0,
		borderColor: colors.white
	},
	cancel: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.accentGray
	},
	cancelText: {
		color: colors.accentGray
	},
	warning: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.red
	},
	info: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.primaryFox
	},
	warningText: {
		color: colors.red
	},
	neutral: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.lightGray
	},
	neutralText: {
		color: colors.lightGray
	},
	danger: {
		backgroundColor: colors.red,
		borderColor: colors.red,
		borderWidth: 1
	}
});

function getStyles(type) {
	let fontStyle, containerStyle;
	switch (type) {
		case 'orange':
			fontStyle = styles.orangeText;
			containerStyle = styles.orange;
			break;
		case 'blue':
			fontStyle = styles.blueText;
			containerStyle = styles.blue;
			break;
		case 'confirm':
			fontStyle = styles.confirmText;
			containerStyle = styles.confirm;
			break;
		case 'normal':
			fontStyle = styles.normalText;
			containerStyle = styles.normal;
			break;
		case 'rounded-normal':
			fontStyle = styles.roundedNormalText;
			containerStyle = styles.roundedNormal;
			break;
		case 'cancel':
			fontStyle = styles.cancelText;
			containerStyle = styles.cancel;
			break;
		case 'transparent':
			fontStyle = styles.normalText;
			containerStyle = styles.transparent;
			break;
		case 'warning':
			fontStyle = styles.warningText;
			containerStyle = styles.warning;
			break;
		case 'info':
			fontStyle = styles.infoText;
			containerStyle = styles.info;
			break;
		case 'neutral':
			fontStyle = styles.neutralText;
			containerStyle = styles.neutral;
			break;
		case 'danger':
			fontStyle = styles.confirmText;
			containerStyle = styles.danger;
			break;
		default:
			throw new Error('Unknown button type');
	}

	return {
		fontStyle: [styles.text, fontStyle],
		containerStyle: [styles.container, containerStyle]
	};
}

export default getStyles;