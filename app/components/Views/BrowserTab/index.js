import React, { PureComponent } from 'react';
import {
	Dimensions,
	Text,
	ActivityIndicator,
	Platform,
	StyleSheet,
	TextInput,
	View,
	TouchableWithoutFeedback,
	Alert,
	Animated,
	TouchableOpacity,
	Linking,
	Keyboard,
	BackHandler,
	LayoutAnimation
} from 'react-native';
import { withNavigation } from 'react-navigation';
import Web3Webview from 'react-native-web3-webview';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import RNFS from 'react-native-fs';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import { connect } from 'react-redux';
import BackgroundBridge from '../../../core/BackgroundBridge';
import Engine from '../../../core/Engine';
import PhishingModal from '../../UI/PhishingModal';
import WebviewProgressBar from '../../UI/WebviewProgressBar';
import BrowserHome from '../../Views/BrowserHome';
import { colors, fontStyles } from '../../../styles/common';
import Networks from '../../../util/networks';
import Logger from '../../../util/Logger';
import onUrlSubmit, { getHost } from '../../../util/browser';
import resolveEnsToIpfsContentId from '../../../lib/ens-ipfs/resolver';
import Button from '../../UI/Button';
import { strings } from '../../../../locales/i18n';
import URL from 'url-parse';
import Modal from 'react-native-modal';
import PersonalSign from '../../UI/PersonalSign';
import TypedSign from '../../UI/TypedSign';
import UrlAutocomplete from '../../UI/UrlAutocomplete';
import AccountApproval from '../../UI/AccountApproval';
import { approveHost } from '../../../actions/privacy';
import { addBookmark } from '../../../actions/bookmarks';
import { addToHistory, addToWhitelist } from '../../../actions/browser';
import { setTransactionObject } from '../../../actions/transaction';
import { hexToBN, fromWei } from '../../../util/number';
import DeviceSize from '../../../util/DeviceSize';
import AppConstants from '../../../core/AppConstants';
import SearchApi from 'react-native-search-api';
import DeeplinkManager from '../../../core/DeeplinkManager';
import Branch from 'react-native-branch';
import WatchAssetRequest from '../../UI/WatchAssetRequest';
import TabCountIcon from '../../UI/Tabs/TabCountIcon';

const HOMEPAGE_URL = 'about:blank';
const SUPPORTED_TOP_LEVEL_DOMAINS = ['eth', 'test'];
const BOTTOM_NAVBAR_HEIGHT = Platform.OS === 'ios' && DeviceSize.isIphoneX() ? 86 : 60;
const MAX_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
	icon: {
		color: colors.grey500,
		height: 28,
		lineHeight: 28,
		textAlign: 'center',
		width: 36,
		alignSelf: 'center'
	},
	disabledIcon: {
		color: colors.grey100
	},
	progressBarWrapper: {
		height: 3,
		width: '100%',
		left: 0,
		right: 0,
		top: 0,
		position: 'absolute'
	},
	loader: {
		backgroundColor: colors.white,
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	optionsOverlay: {
		position: 'absolute',
		zIndex: 99999998,
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	},
	optionsWrapper: {
		position: 'absolute',
		zIndex: 99999999,
		width: 200,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.grey100,
		backgroundColor: colors.grey000
	},
	optionsWrapperAndroid: {
		top: 0,
		right: 0,
		elevation: 5
	},
	optionsWrapperIos: {
		shadowColor: colors.grey400,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 3,
		bottom: 70,
		right: 3
	},
	option: {
		backgroundColor: colors.grey000,
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		marginTop: Platform.OS === 'android' ? 0 : -5
	},
	optionText: {
		fontSize: 14,
		color: colors.fontPrimary,
		...fontStyles.normal
	},
	optionIcon: {
		width: 18,
		color: colors.grey500,
		flex: 0,
		height: 15,
		lineHeight: 15,
		marginRight: 10,
		textAlign: 'center',
		alignSelf: 'center'
	},
	bottomBar: {
		backgroundColor: colors.grey000,
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingTop: Platform.OS === 'ios' && DeviceSize.isIphoneX() ? 15 : 12,
		paddingBottom: Platform.OS === 'ios' && DeviceSize.isIphoneX() ? 32 : 8,
		flexDirection: 'row',
		flex: 1
	},
	iconSearch: {
		alignSelf: 'flex-end',
		alignContent: 'flex-end'
	},
	iconMore: {
		alignSelf: 'flex-end',
		alignContent: 'flex-end'
	},
	iconsLeft: {
		flex: 1,
		alignContent: 'flex-start',
		flexDirection: 'row'
	},
	iconsMiddle: {
		flex: 1,
		alignContent: 'center',
		flexDirection: 'row',
		justifyContent: 'center'
	},
	iconsRight: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end'
	},
	tabIcon: {
		width: 30,
		height: 30
	},
	urlModalContent: {
		flexDirection: 'row',
		paddingTop: Platform.OS === 'android' ? 10 : DeviceSize.isIphoneX() ? 50 : 27,
		paddingHorizontal: 10,
		backgroundColor: colors.white,
		height: Platform.OS === 'android' ? 59 : DeviceSize.isIphoneX() ? 87 : 65
	},
	urlModal: {
		justifyContent: 'flex-start',
		margin: 0
	},
	urlInput: {
		...fontStyles.normal,
		backgroundColor: Platform.OS === 'android' ? colors.white : colors.grey000,
		borderRadius: 30,
		fontSize: Platform.OS === 'android' ? 16 : 14,
		padding: 8,
		paddingLeft: 15,
		textAlign: 'left',
		flex: 1,
		height: Platform.OS === 'android' ? 40 : 30
	},
	cancelButton: {
		marginTop: 7,
		marginLeft: 10
	},
	cancelButtonText: {
		fontSize: 14,
		color: colors.blue,
		...fontStyles.normal
	},
	iconCloseButton: {
		borderRadius: 300,
		backgroundColor: colors.fontSecondary,
		color: colors.white,
		fontSize: 18,
		padding: 0,
		height: 20,
		width: 20,
		paddingBottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 10,
		marginRight: 5
	},
	iconClose: {
		color: colors.white,
		fontSize: 18
	},
	bottomModal: {
		justifyContent: 'flex-end',
		margin: 0
	},
	fullScreenModal: {
		flex: 1
	},
	homepage: {
		flex: 1,
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	}
});

/**
 * Complete Web browser component with URL entry and history management
 * which represents an individual tab inside the <Browser /> component
 */
export class BrowserTab extends PureComponent {
	static defaultProps = {
		defaultProtocol: 'https://'
	};

	static propTypes = {
		/**
		 * The ID of the current tab
		 */
		id: PropTypes.number,
		/**
		 * The ID of the active tab
		 */
		activeTab: PropTypes.number,
		/**
		 * InitialUrl
		 */
		initialUrl: PropTypes.string,
		/**
		 * Called to approve account access for a given hostname
		 */
		approveHost: PropTypes.func,
		/**
		 * Map of hostnames with approved account access
		 */
		approvedHosts: PropTypes.object,
		/**
		 * Protocol string to append to URLs that have none
		 */
		defaultProtocol: PropTypes.string,
		/**
		 * A string that of the chosen ipfs gateway
		 */
		ipfsGateway: PropTypes.string,
		/**
		 * Object containing the information for the current transaction
		 */
		transaction: PropTypes.object,
		/**
		 * react-navigation object used to switch between screens
		 */
		navigation: PropTypes.object,
		/**
		 * A string representing the network type
		 */
		networkType: PropTypes.string,
		/**
		 * A string representing the network id
		 */
		network: PropTypes.string,
		/**
		 * Indicates whether privacy mode is enabled
		 */
		privacyMode: PropTypes.bool,
		/**
		 * A string that represents the selected address
		 */
		selectedAddress: PropTypes.string,
		/**
		 * whitelisted url to bypass the phishing detection
		 */
		whitelist: PropTypes.array,
		/**
		 * Url coming from an external source
		 * For ex. deeplinks
		 */
		url: PropTypes.string,
		/**
		 * Function to store bookmarks
		 */
		addBookmark: PropTypes.func,
		/**
		 * Array of bookmarks
		 */
		bookmarks: PropTypes.array,
		/**
		 * String representing the current search engine
		 */
		searchEngine: PropTypes.string,
		/**
		 * Action that sets a transaction
		 */
		setTransactionObject: PropTypes.func,
		/**
		 * Function to store the a page in the browser history
		 */
		addToBrowserHistory: PropTypes.func,
		/**
		 * Function to store the a website in the browser whitelist
		 */
		addToWhitelist: PropTypes.func,
		/**
		 * Function to update the tab information
		 */
		updateTabInfo: PropTypes.func,
		/**
		 * Function to update the tab information
		 */
		showTabs: PropTypes.func
	};

	constructor(props) {
		super(props);

		const { scrollAnim, offsetAnim, clampedScroll } = this.initScrollVariables();

		this.state = {
			approvedOrigin: false,
			currentEnsName: null,
			currentPageTitle: '',
			currentPageUrl: '',
			currentPageIcon: undefined,
			entryScriptWeb3: null,
			fullHostname: '',
			hostname: '',
			inputValue: '',
			autocompleteInputValue: '',
			ipfsGateway: 'https://ipfs.io/ipfs/',
			ipfsHash: null,
			ipfsWebsite: false,
			showApprovalDialog: false,
			showPhishingModal: false,
			signMessage: false,
			signMessageParams: { data: '' },
			signType: '',
			timeout: false,
			url: props.initialUrl || HOMEPAGE_URL,
			scrollAnim,
			offsetAnim,
			clampedScroll,
			contentHeight: 0,
			forwardEnabled: false,
			forceReload: false,
			suggestedAssetMeta: undefined,
			watchAsset: false,
			activated: props.id === props.activeTab,
			height: new Animated.Value(0),
			flex: MAX_HEIGHT - 2 * BOTTOM_NAVBAR_HEIGHT
		};
	}

	webview = React.createRef();
	inputRef = React.createRef();
	main = React.createRef();
	bottomBar = React.createRef();
	timeoutHandler = null;
	snapshotTimer = null;
	prevScrollOffset = 0;
	goingBack = false;
	forwardHistoryStack = [];
	approvalRequest;
	accountsRequest;

	clampedScrollValue = 0;
	offsetValue = 0;
	scrollValue = 0;
	scrollStopTimer = null;

	initScrollVariables() {
		const scrollAnim = Platform.OS === 'ios' ? new Animated.Value(0) : null;
		const offsetAnim = Platform.OS === 'ios' ? new Animated.Value(0) : null;
		let clampedScroll = null;
		if (Platform.OS === 'ios') {
			clampedScroll = Animated.diffClamp(
				Animated.add(
					scrollAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [0, 1],
						extrapolateLeft: 'clamp'
					}),
					offsetAnim
				),
				0,
				BOTTOM_NAVBAR_HEIGHT
			);
		}

		return { scrollAnim, offsetAnim, clampedScroll };
	}

	async componentDidMount() {
		if (this.state.url !== HOMEPAGE_URL && Platform.OS === 'android' && this.isTabActive()) {
			this.reload();
		}

		this.mounted = true;
		this.backgroundBridge = new BackgroundBridge(Engine, this.webview, {
			eth_requestAccounts: ({ hostname, params }) => {
				const { approvedHosts, privacyMode, selectedAddress } = this.props;
				const promise = new Promise((resolve, reject) => {
					this.approvalRequest = { resolve, reject };
				});
				if (!privacyMode || ((!params || !params.force) && approvedHosts[hostname])) {
					this.approvalRequest.resolve([selectedAddress]);
					this.backgroundBridge.enableAccounts();
				} else {
					// Let the damn website load first!
					// Otherwise we don't get enough time to load the metadata
					// (title, icon, etc)

					setTimeout(() => {
						this.setState({ showApprovalDialog: true });
					}, 1000);
				}
				return promise;
			},
			eth_accounts: ({ id, jsonrpc, hostname }) => {
				const { approvedHosts, privacyMode, selectedAddress } = this.props;
				const isEnabled = !privacyMode || approvedHosts[hostname];
				const promise = new Promise((resolve, reject) => {
					this.accountsRequest = { resolve, reject };
				});
				if (isEnabled) {
					this.accountsRequest.resolve({ id, jsonrpc, result: [selectedAddress] });
				} else {
					this.accountsRequest.resolve({ id, jsonrpc, result: [] });
				}
				return promise;
			},
			web3_clientVersion: payload =>
				Promise.resolve({ result: 'MetaMask/0.1.0/Alpha/Mobile', jsonrpc: payload.jsonrpc, id: payload.id }),
			wallet_scanQRCode: payload => {
				const promise = new Promise((resolve, reject) => {
					this.props.navigation.navigate('QRScanner', {
						onScanSuccess: data => {
							let result = data;
							if (data.target_address) {
								result = data.target_address;
							} else if (data.scheme) {
								result = JSON.stringify(data);
							}
							resolve({ result, jsonrpc: payload.jsonrpc, id: payload.id });
						},
						onScanError: e => {
							reject({ errir: e.toString(), jsonrpc: payload.jsonrpc, id: payload.id });
						}
					});
				});
				return promise;
			},
			wallet_watchAsset: async ({ params }) => {
				const {
					options: { address, decimals, image, symbol },
					type
				} = params;
				const { AssetsController } = Engine.context;
				const suggestionResult = await AssetsController.watchAsset({ address, symbol, decimals, image }, type);
				return suggestionResult.result;
			},
			metamask_isApproved: async ({ hostname }) => ({
				isApproved: !!this.props.approvedHosts[hostname]
			})
		});

		const entryScriptWeb3 =
			Platform.OS === 'ios'
				? await RNFS.readFile(`${RNFS.MainBundlePath}/InpageBridgeWeb3.js`, 'utf8')
				: await RNFS.readFileAssets(`InpageBridgeWeb3.js`);

		const updatedentryScriptWeb3 = entryScriptWeb3.replace(
			'undefined; // INITIAL_NETWORK',
			this.props.networkType === 'rpc'
				? `'${this.props.network}'`
				: `'${Networks[this.props.networkType].networkId}'`
		);

		const SPA_urlChangeListener = `(function () {
			var __mmHistory = window.history;
			var __mmPushState = __mmHistory.pushState;
			var __mmReplaceState = __mmHistory.replaceState;
			function __mm__updateUrl(){
				const siteName = document.querySelector('head > meta[property="og:site_name"]');
				const title = siteName || document.querySelector('head > meta[name="title"]') || document.title;
				const height = Math.max(document.documentElement.clientHeight, document.documentElement.scrollHeight, document.body.clientHeight, document.body.scrollHeight);

				window.postMessageToNative(
					{
						type: 'NAV_CHANGE',
						payload: {
							url: location.href,
							title: title,
						}
					}
				);

				setTimeout(() => {
					const height = Math.max(document.documentElement.clientHeight, document.documentElement.scrollHeight, document.body.clientHeight, document.body.scrollHeight);
					window.postMessageToNative(
					{
						type: 'GET_HEIGHT',
						payload: {
							height: height
						}
					})
				}, 500);
			}

			__mmHistory.pushState = function(state) {
				setTimeout(function () {
					__mm__updateUrl();
				}, 100);
				return __mmPushState.apply(history, arguments);
			};

			__mmHistory.replaceState = function(state) {
				setTimeout(function () {
					__mm__updateUrl();
				}, 100);
				return __mmReplaceState.apply(history, arguments);
			};

			window.onpopstate = function(event) {
				__mm__updateUrl();
			};
		  })();
		`;

		await this.setState({ entryScriptWeb3: updatedentryScriptWeb3 + SPA_urlChangeListener });

		Engine.context.TransactionController.hub.on('unapprovedTransaction', this.onUnapprovedTransaction);

		Engine.context.PersonalMessageManager.hub.on('unapprovedMessage', messageParams => {
			if (!this.isTabActive()) return false;
			this.setState({ signMessage: true, signMessageParams: messageParams, signType: 'personal' });
		});
		Engine.context.TypedMessageManager.hub.on('unapprovedMessage', messageParams => {
			if (!this.isTabActive()) return false;
			this.setState({ signMessage: true, signMessageParams: messageParams, signType: 'typed' });
		});

		Engine.context.AssetsController.hub.on('pendingSuggestedAsset', suggestedAssetMeta => {
			if (!this.isTabActive()) return false;
			this.setState({ watchAsset: true, suggestedAssetMeta });
		});

		Branch.subscribe(this.handleDeeplinks);

		if (Platform.OS === 'ios') {
			this.state.scrollAnim.addListener(({ value }) => {
				const diff = value - this.scrollValue;
				this.scrollValue = value;
				this.clampedScrollValue = Math.min(Math.max(this.clampedScrollValue + diff, 0), BOTTOM_NAVBAR_HEIGHT);
			});
			this.state.offsetAnim.addListener(({ value }) => {
				this.offsetValue = value;
			});
		} else {
			this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
		}

		// Listen to network changes
		Engine.context.TransactionController.hub.on('networkChange', this.reload);

		BackHandler.addEventListener('hardwareBackPress', this.handleAndroidBackPress);
	}

	handleDeeplinks = async ({ error, params }) => {
		if (!this.isTabActive()) return false;
		if (error) {
			Logger.error('Error from Branch: ', error);
			return;
		}
		if (params['+non_branch_link']) {
			const dm = new DeeplinkManager(this.props.navigation);
			dm.parse(params['+non_branch_link']);
		} else if (params.spotlight_identifier) {
			setTimeout(() => {
				this.props.navigation.setParams({
					url: params.spotlight_identifier,
					silent: false,
					showUrlModal: false
				});
			}, 1000);
		}
	};

	handleAndroidBackPress = () => {
		if (!this.isTabActive()) return false;

		if (this.state.url === HOMEPAGE_URL && this.props.navigation.getParam('url', null) === null) {
			return false;
		}
		this.goBack();
		return true;
	};

	onUnapprovedTransaction = transactionMeta => {
		if (!this.isTabActive()) return false;
		if (this.props.transaction.value || this.props.transaction.to) {
			return;
		}
		const {
			transaction: { value, gas, gasPrice }
		} = transactionMeta;
		transactionMeta.transaction.value = hexToBN(value);
		transactionMeta.transaction.readableValue = fromWei(transactionMeta.transaction.value);
		transactionMeta.transaction.gas = hexToBN(gas);
		transactionMeta.transaction.gasPrice = hexToBN(gasPrice);
		this.props.setTransactionObject({
			...{ symbol: 'ETH', type: 'ETHER_TRANSACTION', assetType: 'ETH', id: transactionMeta.id },
			...transactionMeta.transaction
		});
		this.props.navigation.push('ApprovalView');
	};

	async loadUrl() {
		if (!this.isTabActive()) return;
		const { navigation } = this.props;
		if (navigation) {
			const url = navigation.getParam('url', null);
			const silent = navigation.getParam('silent', false);
			if (url && !silent) {
				await this.go(url);
			}
		}
	}

	setTabActive() {
		this.setState({ activated: true });
	}

	componentDidUpdate(prevProps) {
		const prevNavigation = prevProps.navigation;
		const { navigation } = this.props;
		LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);

		// If tab wasn't activated and we detect an tab change
		// we need to check if it's time to activate the tab
		if (!this.state.activated && prevProps.activeTab !== this.props.activeTab) {
			if (this.props.id === this.props.activeTab) {
				this.setTabActive();
			}
		}

		if (prevNavigation && navigation) {
			const prevUrl = prevNavigation.getParam('url', null);
			const currentUrl = navigation.getParam('url', null);

			if (currentUrl && prevUrl !== currentUrl && currentUrl !== this.state.url) {
				this.loadUrl();
			}
		}
	}

	componentWillUnmount() {
		this.mounted = false;
		// Remove all Engine listeners
		Engine.context.PersonalMessageManager.hub.removeAllListeners();
		Engine.context.TypedMessageManager.hub.removeAllListeners();
		Engine.context.AssetsController.hub.removeAllListeners();
		Engine.context.TransactionController.hub.removeListener('unapprovedTransaction', this.onUnapprovedTransaction);
		Engine.context.TransactionController.hub.removeListener('networkChange', this.reload);
		if (Platform.OS === 'ios') {
			this.state.scrollAnim && this.state.scrollAnim.removeAllListeners();
			this.state.offsetAnim && this.state.offsetAnim.removeAllListeners();
		} else {
			this.keyboardDidHideListener && this.keyboardDidHideListener.remove();
			BackHandler.removeEventListener('hardwareBackPress', this.handleAndroidBackPress);
		}
	}

	keyboardDidHide = () => {
		if (!this.isTabActive()) return false;
		const showUrlModal = (this.props.navigation && this.props.navigation.getParam('showUrlModal', false)) || false;
		if (showUrlModal) {
			this.hideUrlModal();
		}
	};

	isENSUrl(url) {
		const urlObj = new URL(url);
		const { hostname } = urlObj;
		const tld = hostname.split('.').pop();
		if (SUPPORTED_TOP_LEVEL_DOMAINS.indexOf(tld.toLowerCase()) !== -1) {
			return true;
		}
		return false;
	}

	isAllowedUrl = url => {
		const urlObj = new URL(url);
		const { PhishingController } = Engine.context;
		return (
			(this.props.whitelist && this.props.whitelist.includes(urlObj.hostname)) ||
			(PhishingController && !PhishingController.test(urlObj.hostname))
		);
	};

	handleNotAllowedUrl = (urlToGo, hostname) => {
		let host = hostname;
		if (!host) {
			const urlObj = new URL(urlToGo);
			host = urlObj.hostname;
		}
		this.blockedUrl = urlToGo;
		setTimeout(() => {
			this.setState({ showPhishingModal: true });
		}, 500);
	};

	updateTabInfo(url) {
		this.isTabActive() && this.props.updateTabInfo(url, this.props.id);
	}

	go = async url => {
		const hasProtocol = url.match(/^[a-z]*:\/\//) || url === HOMEPAGE_URL;
		const sanitizedURL = hasProtocol ? url : `${this.props.defaultProtocol}${url}`;
		const urlObj = new URL(sanitizedURL);
		const { hostname, query, pathname } = urlObj;
		const { ipfsGateway } = this.props;

		let ipfsContent = null;
		let currentEnsName = null;
		let ipfsHash = null;

		if (this.isENSUrl(sanitizedURL)) {
			ipfsContent = await this.handleIpfsContent(sanitizedURL, { hostname, query, pathname });

			if (ipfsContent) {
				const urlObj = new URL(sanitizedURL);
				currentEnsName = urlObj.hostname;
				ipfsHash = ipfsContent
					.replace(ipfsGateway, '')
					.split('/')
					.shift();
			}
			// Needed for the navbar to mask the URL
			this.props.navigation.setParams({
				...this.props.navigation.state.params,
				currentEnsName: urlObj.hostname
			});
		}
		const urlToGo = ipfsContent || sanitizedURL;

		if (this.isAllowedUrl(urlToGo)) {
			this.setState({
				url: urlToGo,
				progress: 0,
				ipfsWebsite: !!ipfsContent,
				inputValue: sanitizedURL,
				currentEnsName,
				ipfsHash,
				hostname: this.formatHostname(hostname)
			});
			this.updateTabInfo(sanitizedURL);

			this.timeoutHandler && clearTimeout(this.timeoutHandler);
			if (urlToGo !== HOMEPAGE_URL) {
				this.timeoutHandler = setTimeout(() => {
					this.urlTimedOut(urlToGo);
				}, 60000);
			}

			return sanitizedURL;
		}
		this.handleNotAllowedUrl(urlToGo, hostname);
		return null;
	};

	urlTimedOut(url) {
		Logger.log('Browser::url::Timeout!', url);
	}

	urlNotFound(url) {
		Logger.log('Browser::url::Not found!', url);
	}

	urlNotSupported(url) {
		Logger.log('Browser::url::Not supported!', url);
	}

	urlErrored(url) {
		Logger.log('Browser::url::Unknown error!', url);
	}

	async handleIpfsContent(fullUrl, { hostname, pathname, query }) {
		const { provider } = Engine.context.NetworkController;
		const { ipfsGateway } = this.props;

		let ipfsHash;
		try {
			ipfsHash = await resolveEnsToIpfsContentId({ provider, name: hostname });
		} catch (err) {
			this.timeoutHandler && clearTimeout(this.timeoutHandler);
			Logger.error('Failed to resolve ENS name', err);
			err === 'unsupport' ? this.urlNotSupported(fullUrl) : this.urlErrored(fullUrl);
			return null;
		}

		const gatewayUrl = `${ipfsGateway}${ipfsHash}${pathname || '/'}${query || ''}`;

		try {
			const response = await fetch(gatewayUrl, { method: 'HEAD' });
			const statusCode = response.status;
			if (statusCode !== 200) {
				this.urlNotFound(gatewayUrl);
				return null;
			}
			return gatewayUrl;
		} catch (err) {
			// If there's an error our fallback mechanism is
			// to point straight to the ipfs gateway
			Logger.error('Failed to fetch ipfs website via ens', err);
			return `https://ipfs.io/ipfs/${ipfsHash}/`;
		}
	}

	onUrlInputSubmit = async (input = null) => {
		this.toggleOptionsIfNeeded();
		const inputValue = (typeof input === 'string' && input) || this.state.autocompleteInputValue;
		const { defaultProtocol, searchEngine } = this.props;
		if (inputValue !== '') {
			const sanitizedInput = onUrlSubmit(inputValue, searchEngine, defaultProtocol);
			const url = await this.go(sanitizedInput);
			this.hideUrlModal(url);
		} else {
			this.hideUrlModal();
		}
	};

	goBack = () => {
		this.toggleOptionsIfNeeded();
		this.goingBack = true;
		setTimeout(() => {
			this.goingBack = false;
		}, 500);

		if (this.initialUrl && this.state.inputValue !== this.initialUrl) {
			const { current } = this.webview;
			current && current.goBack();
			setTimeout(() => {
				this.setState({ forwardEnabled: true });
				this.props.navigation.setParams({
					...this.props.navigation.state.params,
					url: this.state.inputValue
				});
			}, 100);
		} else {
			this.goBackToHomepage();
		}
	};

	goBackToHomepage = () => {
		this.toggleOptionsIfNeeded();
		this.props.navigation.setParams({
			url: null
		});

		const { scrollAnim, offsetAnim, clampedScroll } = this.initScrollVariables();

		this.setState({
			approvedOrigin: false,
			currentEnsName: null,
			currentPageTitle: '',
			currentPageUrl: '',
			currentPageIcon: undefined,
			fullHostname: '',
			hostname: '',
			inputValue: '',
			autocompleteInputValue: '',
			ipfsHash: null,
			ipfsWebsite: false,
			showApprovalDialog: false,
			showPhishingModal: false,
			signMessage: false,
			signMessageParams: { data: '' },
			signType: '',
			timeout: false,
			url: HOMEPAGE_URL,
			scrollAnim,
			offsetAnim,
			clampedScroll,
			contentHeight: 0,
			forwardEnabled: false
		});

		this.initialUrl = null;
	};

	close = () => {
		this.toggleOptionsIfNeeded();
		this.props.navigation.pop();
	};

	goForward = () => {
		if (this.canGoForward()) {
			this.toggleOptionsIfNeeded();
			const { current } = this.webview;
			this.setState({ forwardEnabled: false });
			current && current.goForward();
			setTimeout(() => {
				this.props.navigation.setParams({
					...this.props.navigation.state.params,
					url: this.state.inputValue
				});
			}, 100);
		}
	};

	reload = () => {
		this.toggleOptionsIfNeeded();
		if (Platform.OS === 'ios') {
			const { current } = this.webview;
			current && current.reload();
		} else {
			// Force unmount the webview to avoid caching problems
			this.setState({ forceReload: true }, () => {
				setTimeout(() => {
					this.setState({ forceReload: false }, () => {
						setTimeout(() => {
							this.go(this.state.inputValue);
						}, 300);
					});
				}, 300);
			});
		}
	};

	bookmark = () => {
		this.toggleOptionsIfNeeded();
		// Check it doesn't exist already
		if (this.props.bookmarks.filter(i => i.url === this.state.inputValue).length) {
			Alert.alert(strings('browser.error'), strings('browser.bookmark_already_exists'));
			return false;
		}

		this.props.navigation.push('AddBookmarkView', {
			title: this.state.currentPageTitle || '',
			url: this.state.inputValue,
			onAddBookmark: async ({ name, url }) => {
				this.props.addBookmark({ name, url });
				if (Platform.OS === 'ios') {
					const item = {
						uniqueIdentifier: url,
						title: name || url,
						contentDescription: `Launch ${name || url} on MetaMask`,
						keywords: [name.split(' '), url, 'dapp'],
						thumbnail: { uri: `https://api.faviconkit.com/${getHost(url)}/256` }
					};
					try {
						SearchApi.indexSpotlightItem(item);
					} catch (e) {
						Logger.error('Error adding to spotlight', e);
					}
				}
			}
		});
	};

	share = () => {
		this.toggleOptionsIfNeeded();
		Share.open({
			url: this.state.inputValue
		}).catch(err => {
			Logger.log('Error while trying to share address', err);
		});
	};

	changeUrl = () => {
		this.toggleOptionsIfNeeded();
		setTimeout(() => {
			this.showUrlModal();
		}, 300);
	};

	openInBrowser = () => {
		this.toggleOptionsIfNeeded();
		Linking.openURL(this.state.inputValue).catch(error =>
			Logger.log('Error while trying to open external link: ${url}', error)
		);
	};

	toggleOptionsIfNeeded() {
		if (
			this.props.navigation &&
			this.props.navigation.state.params &&
			this.props.navigation.state.params.showOptions
		) {
			this.toggleOptions();
		}
	}

	toggleOptions = () => {
		this.props.navigation &&
			this.props.navigation.setParams({
				...this.props.navigation.state.params,
				showOptions: !this.props.navigation.state.params.showOptions
			});
	};

	onMessage = ({ nativeEvent: { data } }) => {
		try {
			data = typeof data === 'string' ? JSON.parse(data) : data;
			if (!data || !data.type) {
				return;
			}
			switch (data.type) {
				case 'GET_HEIGHT':
					this.setState({ contentHeight: data.payload.height });
					// Reset the navbar every time we change the page
					if (Platform.OS === 'ios') {
						setTimeout(() => {
							this.state.scrollAnim.setValue(0);
							this.state.offsetAnim.setValue(0);
						}, 100);
					}
					break;
				case 'NAV_CHANGE': {
					const { url, title } = data.payload;
					this.setState({ inputValue: url, currentPageTitle: title, forwardEnabled: false });
					this.props.navigation.setParams({ url: data.payload.url, silent: true, showUrlModal: false });
					this.updateTabInfo(data.payload.url);
					if (Platform.OS === 'ios') {
						setTimeout(() => {
							this.resetBottomBarPosition();
						}, 100);
					}
					break;
				}
				case 'INPAGE_REQUEST':
					this.backgroundBridge.onMessage(data);
					break;
				case 'GET_TITLE_FOR_BOOKMARK':
					if (data.payload.title) {
						this.setState({
							currentPageTitle: data.payload.title,
							currentPageUrl: data.payload.url,
							currentPageIcon: data.payload.icon
						});
					}
					break;
			}
		} catch (e) {
			Logger.error(`Browser::onMessage on ${this.state.inputValue}`, e.toString());
		}
	};

	resetBottomBarPosition() {
		const { scrollAnim, offsetAnim, clampedScroll } = this.initScrollVariables();

		this.mounted &&
			this.setState({
				scrollAnim,
				offsetAnim,
				clampedScroll
			});

		const bottomBarPosition = this.state.clampedScroll.interpolate({
			inputRange: [0, BOTTOM_NAVBAR_HEIGHT],
			outputRange: [0, BOTTOM_NAVBAR_HEIGHT],
			extrapolate: 'clamp'
		});

		this.main.setNativeProps({ transform: [{ translateY: bottomBarPosition }] });
	}

	onPageChange = ({ url }) => {
		const { ipfsGateway } = this.props;
		if ((this.goingBack && url === 'about:blank') || (this.initialUrl === url && url === 'about:blank')) {
			this.goBackToHomepage();
			return;
		}

		// Reset the navbar every time we change the page
		if (Platform.OS === 'ios') {
			this.resetBottomBarPosition();
		}

		this.forwardHistoryStack = [];
		const data = {};
		const urlObj = new URL(url);

		data.fullHostname = urlObj.hostname;
		if (!this.state.ipfsWebsite) {
			data.inputValue = url;
		} else if (url.search(`${AppConstants.IPFS_OVERRIDE_PARAM}=false`) === -1) {
			data.inputValue = url.replace(
				`${ipfsGateway}${this.state.ipfsHash}/`,
				`https://${this.state.currentEnsName}/`
			);
		} else if (this.isENSUrl(url)) {
			this.go(url);
			return;
		} else {
			data.inputValue = url;
			data.hostname = this.formatHostname(urlObj.hostname);
		}

		const { fullHostname, inputValue, hostname } = data;
		if (
			fullHostname !== this.state.fullHostname ||
			url.search(`${AppConstants.IPFS_OVERRIDE_PARAM}=false`) !== -1
		) {
			if (this.isTabActive()) {
				this.props.navigation.setParams({ url, silent: true, showUrlModal: false });
			}
		}
		this.updateTabInfo(inputValue);
		this.setState({ fullHostname, inputValue, hostname });
	};

	formatHostname(hostname) {
		return hostname.toLowerCase().replace('www.', '');
	}

	onURLChange = inputValue => {
		this.setState({ autocompleteInputValue: inputValue });
	};

	sendStateUpdate = () => {
		this.backgroundBridge.sendStateUpdate();
	};

	onLoadProgress = progress => {
		this.setState({ progress });
	};

	onLoadEnd = () => {
		if (Platform.OS === 'ios') {
			setTimeout(() => {
				this.state.scrollAnim.setValue(0);
			}, 100);
		}

		const { approvedHosts, privacyMode } = this.props;
		if (!privacyMode || approvedHosts[this.state.fullHostname]) {
			this.backgroundBridge.enableAccounts();
		}

		// Wait for the title, then store the visit
		setTimeout(() => {
			this.props.addToBrowserHistory({
				name: this.state.currentPageTitle,
				url: this.state.inputValue
			});
		}, 500);

		// Let's wait for potential redirects that might break things
		if (!this.initialUrl || this.initialUrl === HOMEPAGE_URL) {
			setTimeout(() => {
				this.initialUrl = this.state.inputValue;
			}, 1000);
		}

		// We need to get the title of the page and the height
		const { current } = this.webview;
		const js = `
			(function () {
				const shortcutIcon = window.document.querySelector('head > link[rel="shortcut icon"]');
				const icon = shortcutIcon || Array.from(window.document.querySelectorAll('head > link[rel="icon"]')).find((icon) => Boolean(icon.href));

				const siteName = document.querySelector('head > meta[property="og:site_name"]');
				const title = siteName || document.querySelector('head > meta[name="title"]');

				window.postMessageToNative(
					{
						type: 'GET_TITLE_FOR_BOOKMARK',
						payload: {
							title: title ? title.content : document.title,
							url: location.href,
							icon: icon && icon.href
						}
					}
				)
				${
					Platform.OS === 'ios'
						? `setTimeout(() => {
					const height = Math.max(document.documentElement.clientHeight, document.documentElement.scrollHeight, document.body.clientHeight, document.body.scrollHeight);
					window.postMessageToNative(
					{
						type: 'GET_HEIGHT',
						payload: {
							height: height
						}
					})
				}, 500)`
						: ''
				}
			})();
		`;
		Platform.OS === 'ios' ? current.evaluateJavaScript(js) : current.injectJavaScript(js);
		clearTimeout(this.timeoutHandler);
	};

	renderLoader = () => (
		<View style={styles.loader}>
			<ActivityIndicator size="small" />
		</View>
	);

	renderOptions = () => {
		const showOptions = (this.props.navigation && this.props.navigation.getParam('showOptions', false)) || false;
		if (showOptions) {
			return (
				<TouchableWithoutFeedback onPress={this.toggleOptions}>
					<View style={styles.optionsOverlay}>
						<View
							style={[
								styles.optionsWrapper,
								Platform.OS === 'android' ? styles.optionsWrapperAndroid : styles.optionsWrapperIos
							]}
						>
							{Platform.OS === 'android' && this.canGoBack() ? (
								<Button onPress={this.goBack} style={styles.option}>
									<Icon name="arrow-left" size={15} style={styles.optionIcon} />
									<Text style={styles.optionText} numberOfLines={1}>
										{strings('browser.go_back')}
									</Text>
								</Button>
							) : null}
							{Platform.OS === 'android' && this.canGoForward() ? (
								<Button onPress={this.goForward} style={styles.option}>
									<Icon name="arrow-right" size={15} style={styles.optionIcon} />
									<Text style={styles.optionText} numberOfLines={1}>
										{strings('browser.go_forward')}
									</Text>
								</Button>
							) : null}
							<Button onPress={this.reload} style={styles.option}>
								<Icon name="refresh" size={15} style={styles.optionIcon} />
								<Text style={styles.optionText} numberOfLines={1}>
									{strings('browser.reload')}
								</Text>
							</Button>
							<Button onPress={this.goBackToHomepage} style={styles.option}>
								<Icon name="home" size={15} style={styles.optionIcon} />
								<Text style={styles.optionText} numberOfLines={1}>
									{strings('browser.home')}
								</Text>
							</Button>
							<Button onPress={this.bookmark} style={styles.option}>
								<Icon name="star" size={15} style={styles.optionIcon} />
								<Text style={styles.optionText} numberOfLines={1}>
									{strings('browser.add_to_favorites')}
								</Text>
							</Button>
							<Button onPress={this.share} style={styles.option}>
								<Icon name="share" size={15} style={styles.optionIcon} />
								<Text style={styles.optionText} numberOfLines={1}>
									{strings('browser.share')}
								</Text>
							</Button>
							<Button onPress={this.openInBrowser} style={styles.option}>
								<Icon name="expand" size={15} style={styles.optionIcon} />
								<Text style={styles.optionText} numberOfLines={1}>
									{strings('browser.open_in_browser')}
								</Text>
							</Button>
							{Platform.OS === 'android' ? (
								<Button onPress={this.changeUrl} style={styles.option}>
									<MaterialCommunityIcon name="earth" size={18} style={styles.optionIcon} />
									<Text style={styles.optionText} numberOfLines={1}>
										{strings('browser.change_url')}
									</Text>
								</Button>
							) : null}
						</View>
					</View>
				</TouchableWithoutFeedback>
			);
		}
	};

	handleScroll = e => {
		if (Platform.OS === 'android') return;

		const newOffset = e.contentOffset.y;

		const rest = Math.abs(this.scrollValue - newOffset);
		const s = MAX_HEIGHT - BOTTOM_NAVBAR_HEIGHT;
		const g = MAX_HEIGHT - 2 * BOTTOM_NAVBAR_HEIGHT;
		if (
			rest < BOTTOM_NAVBAR_HEIGHT &&
			this.state.flex - (this.scrollValue - newOffset) < s &&
			this.state.flex - (this.scrollValue - newOffset) > g &&
			newOffset > -1
		) {
			//this.main.setNativeProps({ height: this.state.flex - (this.scrollValue - newOffset) });
			//this.setState({flex: this.state.flex -( this.scrollValue - newOffset)})
		}
		if (e.contentSize.height < Dimensions.get('window').height) {
			return;
		}

		if (this.state.progress < 1) {
			return;
		}

		// Avoid wrong position at the beginning
		if ((this.state.scrollAnim._value === 0 && newOffset > BOTTOM_NAVBAR_HEIGHT) || newOffset <= 0) {
			return;
		}

		if (newOffset > this.state.contentHeight - BOTTOM_NAVBAR_HEIGHT) {
			return;
		}

		this.state.scrollAnim.setValue(newOffset);

		this.scrollStopTimer = setTimeout(() => {
			if (Math.abs(this.scrollValue - newOffset) > 1) {
				this.onScrollStop(newOffset);
			}
		}, 200);
	};

	onMomentumScrollBegin = () => {
		if (Platform.OS === 'android') return;
		clearTimeout(this.scrollStopTimer);
	};

	onScrollStop = newOffset => {
		if (Platform.OS === 'android') return;
		const toValue =
			this.clampedScrollValue > BOTTOM_NAVBAR_HEIGHT / 2
				? this.offsetValue + BOTTOM_NAVBAR_HEIGHT
				: this.offsetValue - BOTTOM_NAVBAR_HEIGHT;
		this.scrollValue = newOffset;
		this.animateBottomNavbar(toValue);
	};

	animateBottomNavbar(toValue) {
		Animated.timing(this.state.offsetAnim, {
			toValue,
			duration: 300,
			useNativeDriver: true
		}).start();
	}

	showTabs = () => {
		this.props.showTabs();
	};

	renderBottomBar = (canGoBack, canGoForward) => {
		const { clampedScroll } = this.state;

		const bottomBarPosition = clampedScroll.interpolate({
			inputRange: [0, BOTTOM_NAVBAR_HEIGHT],
			outputRange: [0, BOTTOM_NAVBAR_HEIGHT],
			extrapolate: 'clamp'
		});

		return (
			<Animated.View
				style={[styles.bottomBar, { transform: [{ translateY: bottomBarPosition }] }]}
				ref={this.bottomBar}
			>
				<View style={styles.iconsLeft}>
					<Icon
						name="angle-left"
						disabled={!canGoBack}
						onPress={this.goBack}
						size={40}
						style={{ ...styles.icon, ...(!canGoBack ? styles.disabledIcon : {}) }}
					/>
					<Icon
						disabled={!canGoForward}
						name="angle-right"
						onPress={this.goForward}
						size={40}
						style={{ ...styles.icon, ...(!canGoForward ? styles.disabledIcon : {}) }}
					/>
				</View>
				<View style={styles.iconsMiddle}>
					<TabCountIcon onPress={this.showTabs} style={styles.tabIcon} />
				</View>
				<View style={styles.iconsRight}>
					<IonIcon
						name="ios-search"
						onPress={this.showUrlModal}
						size={30}
						style={[styles.icon, styles.iconSearch]}
					/>
					<MaterialIcon
						name="more-vert"
						onPress={this.toggleOptions}
						size={32}
						style={[styles.icon, styles.iconMore]}
					/>
				</View>
			</Animated.View>
		);
	};

	isHttps() {
		return this.state.inputValue.toLowerCase().substr(0, 6) === 'https:';
	}

	showUrlModal = () => {
		if (!this.isTabActive()) return false;
		this.setState({ autocompleteInputValue: this.state.inputValue });
		this.props.navigation.setParams({
			...this.props.navigation.state.params,
			url: this.state.inputValue,
			showUrlModal: true
		});
	};

	hideUrlModal = url => {
		const urlParam = typeof url === 'string' && url ? url : this.props.navigation.state.params.url;
		this.props.navigation.setParams({
			...this.props.navigation.state.params,
			url: urlParam,
			showUrlModal: false
		});
	};

	clearInputText = () => {
		const { current } = this.inputRef;
		current.clear();
	};

	onAutocomplete = link => {
		this.setState({ inputValue: link }, () => {
			this.onUrlInputSubmit(link);
			this.updateTabInfo(link);
		});
	};

	renderProgressBar = () => (
		<View style={styles.progressBarWrapper}>
			<WebviewProgressBar progress={this.state.progress} />
		</View>
	);

	renderUrlModal = () => {
		const showUrlModal = (this.props.navigation && this.props.navigation.getParam('showUrlModal', false)) || false;

		if (showUrlModal && this.inputRef) {
			setTimeout(() => {
				const { current } = this.inputRef;
				if (current && !current.isFocused()) {
					current.focus();
				}
			}, 300);
		}

		return (
			<Modal
				isVisible={showUrlModal}
				style={styles.urlModal}
				onBackdropPress={this.hideUrlModal}
				animationIn="slideInDown"
				animationOut="slideOutUp"
				backdropOpacity={0.7}
				animationInTiming={300}
				animationOutTiming={300}
				useNativeDriver
			>
				<View style={styles.urlModalContent}>
					<TextInput
						ref={this.inputRef}
						autoCapitalize="none"
						autoCorrect={false}
						clearButtonMode="while-editing"
						onChangeText={this.onURLChange}
						onSubmitEditing={this.onUrlInputSubmit}
						placeholder={strings('autocomplete.placeholder')}
						placeholderTextColor={colors.grey400}
						returnKeyType="go"
						style={styles.urlInput}
						value={this.state.autocompleteInputValue}
						selectTextOnFocus
					/>

					{Platform.OS === 'android' ? (
						<TouchableOpacity onPress={this.clearInputText} style={styles.iconCloseButton}>
							<MaterialIcon name="close" size={20} style={[styles.icon, styles.iconClose]} />
						</TouchableOpacity>
					) : (
						<TouchableOpacity style={styles.cancelButton} onPress={this.hideUrlModal}>
							<Text style={styles.cancelButtonText}>{strings('browser.cancel')}</Text>
						</TouchableOpacity>
					)}
				</View>
				<UrlAutocomplete
					onSubmit={this.onAutocomplete}
					input={this.state.autocompleteInputValue}
					onDismiss={this.hideUrlModal}
				/>
			</Modal>
		);
	};

	onSignAction = () => {
		this.setState({ signMessage: false });
	};

	renderSigningModal = () => {
		const { signMessage, signMessageParams, signType, currentPageTitle, currentPageUrl } = this.state;
		return (
			<Modal
				isVisible={signMessage}
				animationIn="slideInUp"
				animationOut="slideOutDown"
				style={styles.bottomModal}
				backdropOpacity={0.7}
				animationInTiming={600}
				animationOutTiming={600}
				onBackdropPress={this.onSignAction}
				onSwipeComplete={this.onSignAction}
				swipeDirection={'down'}
				propagateSwipe
			>
				{signType === 'personal' && (
					<PersonalSign
						messageParams={signMessageParams}
						onCancel={this.onSignAction}
						onConfirm={this.onSignAction}
						currentPageInformation={{ title: currentPageTitle, url: currentPageUrl }}
					/>
				)}
				{signType === 'typed' && (
					<TypedSign
						messageParams={signMessageParams}
						onCancel={this.onSignAction}
						onConfirm={this.onSignAction}
						currentPageInformation={{ title: currentPageTitle, url: currentPageUrl }}
					/>
				)}
			</Modal>
		);
	};

	onCancelWatchAsset = () => {
		this.setState({ watchAsset: false });
	};

	renderWatchAssetModal = () => {
		const { watchAsset, suggestedAssetMeta } = this.state;
		return (
			<Modal
				isVisible={watchAsset}
				animationIn="slideInUp"
				animationOut="slideOutDown"
				style={styles.bottomModal}
				backdropOpacity={0.7}
				animationInTiming={600}
				animationOutTiming={600}
				onBackdropPress={this.onCancelWatchAsset}
				onSwipeComplete={this.onCancelWatchAsset}
				swipeDirection={'down'}
				propagateSwipe
			>
				<WatchAssetRequest
					onCancel={this.onCancelWatchAsset}
					onConfirm={this.onCancelWatchAsset}
					suggestedAssetMeta={suggestedAssetMeta}
				/>
			</Modal>
		);
	};

	onAccountsConfirm = () => {
		const { approveHost, selectedAddress } = this.props;
		this.setState({ showApprovalDialog: false });
		approveHost(this.state.fullHostname);
		this.backgroundBridge.enableAccounts();
		this.approvalRequest.resolve([selectedAddress]);
	};

	onAccountsReject = () => {
		this.setState({ showApprovalDialog: false });
		this.approvalRequest.reject('User rejected account access');
	};

	renderApprovalModal = () => {
		const { showApprovalDialog, currentPageTitle, currentPageUrl, currentPageIcon } = this.state;
		return (
			<Modal
				isVisible={showApprovalDialog}
				animationIn="slideInUp"
				animationOut="slideOutDown"
				style={styles.bottomModal}
				backdropOpacity={0.7}
				animationInTiming={300}
				animationOutTiming={300}
				onSwipeComplete={this.onSignAction}
				swipeDirection={'down'}
			>
				<AccountApproval
					onCancel={this.onAccountsReject}
					onConfirm={this.onAccountsConfirm}
					currentPageInformation={{ title: currentPageTitle, url: currentPageUrl, icon: currentPageIcon }}
				/>
			</Modal>
		);
	};

	goToETHPhishingDetector = () => {
		this.setState({ showPhishingModal: false });
		this.go(`https://github.com/metamask/eth-phishing-detect`);
	};

	continueToPhishingSite = () => {
		const urlObj = new URL(this.blockedUrl);
		this.props.addToWhitelist(urlObj.hostname);
		this.setState({ showPhishingModal: false });
		setTimeout(() => {
			this.go(this.blockedUrl);
		}, 1000);
	};

	goToEtherscam = () => {
		this.setState({ showPhishingModal: false });
		this.go(`https://etherscamdb.info/domain/meta-mask.com`);
	};

	goToFilePhishingIssue = () => {
		this.setState({ showPhishingModal: false });
		this.go(`https://github.com/metamask/eth-phishing-detect/issues/new`);
	};

	goBackToSafety = () => {
		if (this.canGoBack()) {
			this.mounted && this.setState({ showPhishingModal: false });
		} else {
			this.close();
		}
	};

	renderPhishingModal() {
		const { showPhishingModal } = this.state;
		return (
			<Modal
				isVisible={showPhishingModal}
				animationIn="slideInUp"
				animationOut="slideOutDown"
				style={styles.fullScreenModal}
				backdropOpacity={1}
				backdropColor={colors.red}
				animationInTiming={300}
				animationOutTiming={300}
				useNativeDriver
			>
				<PhishingModal
					fullUrl={this.blockedUrl}
					goToETHPhishingDetector={this.goToETHPhishingDetector}
					continueToPhishingSite={this.continueToPhishingSite}
					goToEtherscam={this.goToEtherscam}
					goToFilePhishingIssue={this.goToFilePhishingIssue}
					goBackToSafety={this.goBackToSafety}
				/>
			</Modal>
		);
	}

	getUserAgent() {
		if (Platform.OS === 'android') {
			return 'Mozilla/5.0 (Linux; Android 8.1.0; Android SDK built for x86 Build/OSM1.180201.023) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36';
		}
		return 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1';
	}

	onLoadStart = () => {
		this.backgroundBridge.disableAccounts();
	};

	canGoBack = () => true;

	canGoForward = () => this.state.forwardEnabled;

	isTabActive = () => {
		const { activeTab, id } = this.props;
		return activeTab === id;
	};

	animVal = new Animated.Value(0);

	interpolateBar = this.animVal.interpolate({ inputRange: [0, 1], outputRange: ['100%', '90%'] });
	animatedTransition = Animated.spring(this.animVal, { toValue: 1 });

	render() {
		const { entryScriptWeb3, url, forceReload, activated } = this.state;

		const canGoBackIOS = Platform.OS === 'ios' && url === HOMEPAGE_URL ? false : this.canGoBack();
		const canGoForward = this.canGoForward();

		const isHidden = !this.isTabActive();

		return (
			<View style={[]}>
				<Animated.View
					style={{
						height: this.state.flex
					}}
					//ref={component => { this.main = component}}
				>
					{activated && !forceReload && (
						<Web3Webview
							injectedOnStartLoadingJavaScript={entryScriptWeb3}
							onProgress={this.onLoadProgress}
							onLoadStart={this.onLoadStart}
							onLoadEnd={this.onLoadEnd}
							onMessage={this.onMessage}
							onNavigationStateChange={this.onPageChange}
							ref={this.webview}
							source={{ uri: url }}
							onScroll={this.handleScroll}
							onMomentumScrollBegin={this.onMomentumScrollBegin}
							scrollEventThrottle={1}
							userAgent={this.getUserAgent()}
							sendCookies
							automaticallyAdjustContentInsets
							javascriptEnabled
						/>
					)}

					{this.renderProgressBar()}
					{!isHidden && url === HOMEPAGE_URL ? (
						<View style={styles.homepage}>
							<BrowserHome goToUrl={this.go} navigation={this.props.navigation} />
						</View>
					) : null}
					{!isHidden && this.renderUrlModal()}
					{!isHidden && this.renderSigningModal()}
					{!isHidden && this.renderApprovalModal()}
					{!isHidden && this.renderPhishingModal()}
					{!isHidden && this.renderWatchAssetModal()}
					{!isHidden && this.renderOptions()}
				</Animated.View>
				{!isHidden && Platform.OS === 'ios' ? this.renderBottomBar(canGoBackIOS, canGoForward) : null}
			</View>
		);
	}
}

const mapStateToProps = state => ({
	approvedHosts: state.privacy.approvedHosts,
	bookmarks: state.bookmarks,
	ipfsGateway: state.engine.backgroundState.PreferencesController.ipfsGateway,
	networkType: state.engine.backgroundState.NetworkController.provider.type,
	network: state.engine.backgroundState.NetworkController.network,
	selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress,
	privacyMode: state.privacy.privacyMode,
	searchEngine: state.settings.searchEngine,
	whitelist: state.browser.whitelist,
	transaction: state.transaction,
	activeTab: state.browser.activeTab
});

const mapDispatchToProps = dispatch => ({
	approveHost: hostname => dispatch(approveHost(hostname)),
	addBookmark: bookmark => dispatch(addBookmark(bookmark)),
	addToBrowserHistory: ({ url, name }) => dispatch(addToHistory({ url, name })),
	addToWhitelist: url => dispatch(addToWhitelist(url)),
	setTransactionObject: asset => dispatch(setTransactionObject(asset))
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withNavigation(BrowserTab));
