<script>
	import { page } from '$app/stores';

	import { onMount } from 'svelte';
	import { ethers } from 'ethers';

	import {
		currencyFormat,
		getSigner_Admin,
		getSigner_Buyer,
		getSigner_Seller,
		getContract_CBDC,
		getContract_EscrowService,
		handleException,
		getOrders,
		autoRetry
	} from '$lib/utils';

	let hasMounted = false;
	let AdminBalance = '';
	let BuyerBalance = '';
	let SellerBalance = '';
	let EscrowedBalance = '';
	let totalSupply = '';

	let Signer_Admin = getSigner_Admin();
	let Signer_Buyer = getSigner_Buyer();
	let Signer_Seller = getSigner_Seller();

	let CBDC = getContract_CBDC();
	let EscrowService = getContract_EscrowService();

	let orders = [];

	onMount(async function () {
		hasMounted = true;

		autoRetry(async () => {
			AdminBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Admin.address));
		});
		autoRetry(async () => {
			BuyerBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Buyer.address));
		});
		autoRetry(async () => {
			SellerBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Seller.address));
		});
		autoRetry(async () => {
			EscrowedBalance = ethers.utils.formatUnits(await CBDC.balanceOf(EscrowService.address));
		});
		autoRetry(async () => {
			totalSupply = ethers.utils.formatUnits(await CBDC.totalSupply());
		});
		autoRetry(async () => {
			orders = await getOrders();
		});

	});

	async function mintCDBC(e) {
		e.preventDefault();

		const $btn = document.getElementById('btn');
		$btn.setAttribute('disabled', 'disabled');

		const amount2mint = document.getElementById('amount2mint').value;

		try {
			const trx = await CBDC.connect(Signer_Admin).mint(ethers.utils.parseEther(amount2mint));
			await trx.wait();

			totalSupply = ethers.utils.formatUnits(await CBDC.totalSupply());
			AdminBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Admin.address));

			UIkit.notification('Success!', { status: 'success' });
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');

		return false;
	}

	async function topupCDBC_Buyer(e) {
		e.preventDefault();

		const $btn = document.getElementById('btn-topup-buyer');
		$btn.setAttribute('disabled', 'disabled');

		const amount2topup = document.getElementById('amount2topup-buyer').value;

		try {
			const trx = await CBDC.connect(Signer_Admin)['transfer(address,uint256)'](
				Signer_Buyer.address,
				ethers.utils.parseEther(amount2topup)
			);
			await trx.wait();

			AdminBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Admin.address));
			BuyerBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Buyer.address));

			UIkit.notification('Success!', { status: 'success' });
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');

		return false;
	}

	async function createPaymentRequest(e) {
		e.preventDefault();

		const $btn = document.getElementById('btn-payment-request');
		$btn.setAttribute('disabled', 'disabled');

		const desc = document.getElementById('payment-request-description').value;
		const amount = document.getElementById('payment-request-amount').value;

		try {
			const trx = await EscrowService.connect(Signer_Seller).createPaymentRequest(
				Signer_Buyer.address,
				ethers.utils.parseEther(amount),
				desc
			);
			await trx.wait();

			orders = await getOrders();

			UIkit.notification('Success!', { status: 'success' });
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');

		return false;
	}

	async function pay(transactionId){
		const $btn = document.querySelector(`[data-pay="${transactionId}"]`);
		$btn.setAttribute('disabled', 'disabled');

		try {
			const trx = await EscrowService.connect(Signer_Buyer).pay(transactionId);
			await trx.wait();

			BuyerBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Buyer.address));
			EscrowedBalance = ethers.utils.formatUnits(await CBDC.balanceOf(EscrowService.address));

			orders = await getOrders();

			UIkit.notification('Success!', { status: 'success' });

			
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');
	}

	async function ship(transactionId){
		const $btn = document.querySelector(`[data-ship="${transactionId}"]`);
		$btn.setAttribute('disabled', 'disabled');

		const trackingNumber = await UIkit.modal.prompt('Please Enter Tracking Number:');

		if(trackingNumber){
			try {
				
				const trx = await EscrowService.connect(Signer_Seller).updateTrackingNumber(transactionId, trackingNumber);
				await trx.wait();

				orders = await getOrders();

				UIkit.notification('Success!', { status: 'success' });

				
			} catch (e) {
				handleException(e);
			}
		}

		$btn.removeAttribute('disabled');

	}

	async function delivered(transactionId){
		const $btn = document.querySelector(`[data-delivered="${transactionId}"]`);
		$btn.setAttribute('disabled', 'disabled');

		try {
			
			const trx = await EscrowService.connect(Signer_Admin).updateDeliveryStatus(transactionId, true);
			await trx.wait();

			orders = await getOrders();

			UIkit.notification('Success!', { status: 'success' });

			
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');
	}

	async function complete(transactionId){
		const $btn = document.querySelector(`[data-complete="${transactionId}"]`);
		$btn.setAttribute('disabled', 'disabled');

		try {
			
			const trx = await EscrowService.connect(Signer_Buyer).confirmDelivery(transactionId);
			await trx.wait();

			orders = await getOrders();
			
			SellerBalance = ethers.utils.formatUnits(await CBDC.balanceOf(Signer_Seller.address));
			EscrowedBalance = ethers.utils.formatUnits(await CBDC.balanceOf(EscrowService.address));

			UIkit.notification('Success!', { status: 'success' });

			
		} catch (e) {
			handleException(e);
		}

		$btn.removeAttribute('disabled');
	}

</script>

<div class="uk-grid">
	<div class="uk-width-1-1">
		<div class="round-card">
			<h2 class="uk-h3">Admin Panel</h2>
			<div class="uk-width-1-2">
				Treasury Balance: <span class="text-hl">{currencyFormat(AdminBalance)} CBDC</span> <br />
				Escrowed Balance: <span class="text-hl">{currencyFormat(EscrowedBalance)} CBDC</span>
				<br />
				<br />
				<div class="round-card l2">
					<h3 class="uk-h4">Mint CBDC</h3>
					Total Supply: <span class="text-hl">{currencyFormat(totalSupply)} CBDC</span>

					<form on:submit={mintCDBC}>
						<input
							id="amount2mint"
							type="number"
							class="uk-input uk-width-1-2"
							min="1"
							step="0.01"
							value="1000"
							required
						/>
						<button id="btn" class="uk-button uk-button-primary">Mint CBDC</button>
					</form>
				</div>
			</div>
		</div>
	</div>

	<div class="uk-width-1-2@m">
		<div class="round-card">
			<h2 class="uk-h3">Seller Panel</h2>
			Balance: <span class="text-hl">{currencyFormat(SellerBalance)} CBDC</span>

			<br />
			<div class="round-card l2">
				<form on:submit={createPaymentRequest}>
					<h3 class="uk-h4">Create Payment Request</h3>

					<h4 class="uk-h5">Order Description</h4>
					<input
						id="payment-request-description"
						type="text"
						class="uk-input"
						placeholder="Order Description"
						required
					/>

					<h4 class="uk-h5">Payment Amount</h4>
					<input
						id="payment-request-amount"
						type="number"
						class="uk-input"
						min="1"
						step="0.01"
						value="100"
						required
					/>

					<br />
					<br />
					<button id="btn-payment-request" class="uk-button uk-button-warning uk-width-1-1"
						>Create Payment Request</button
					>
				</form>
			</div>
		</div>
	</div>

	<div class="uk-width-1-2@m">
		<div class="round-card" style="min-height:450px">
			<h2 class="uk-h3">Buyer Panel</h2>
			Balance: <span class="text-hl">{currencyFormat(BuyerBalance)} CBDC</span>

			<form on:submit={topupCDBC_Buyer}>
				<input
					id="amount2topup-buyer"
					type="number"
					class="uk-input uk-width-2-3"
					min="1"
					max={AdminBalance}
					step="0.01"
					value="500"
					required
				/>
				<button id="btn-topup-buyer" class="uk-button uk-button-success">Top-up CBDC</button>
			</form>
		</div>
	</div>

	<div class="uk-width-1-1">
		{#if orders}
			<div class="round-card">
				<h2 class="uk-h4">Orders</h2>
				<div class="uk-overflow-auto">
					<table class="uk-table uk-table-divider table">
						<thead>
							<tr>
								<th class="uk-text-left">Order Description</th>
								<th class="uk-text-right">CBDC Amount</th>
								<th class="uk-text-center">Status</th>
								<th class="uk-text-center">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each orders.reverse() as order}
								<tr>
									
									<td class="uk-text-left">{order.description}</td>
									<td class="uk-text-right text-hl">{currencyFormat(order.amount)} CBDC</td>
									<td class="uk-text-center">
										{#if !order.isPaid}
											<span class="uk-label uk-label-warning">Unpaid</span>
										{:else if !order.isDelivered && !order.trackingNumber}
											<span class="uk-label uk-label-primary">Waiting to ship</span>
										{:else if !order.isDelivered}
											<span class="uk-label uk-label-primary">In Transit</span>
											<br>
											Tracking: {order.trackingNumber}
										{:else if !order.isCompleted}
											<span class="uk-label uk-label-primary">Delivered</span>
										{:else}
											<span class="uk-label uk-label-success">Completed</span>
										{/if}
									</td>
									<td class="uk-text-center">
										{#if !order.isPaid}
											<button class="uk-button uk-button-success" data-pay={order.transactionId} on:click={()=>pay(order.transactionId)}>
												[Buyer] Make a Payment
											</button>
										{:else if !order.isDelivered && !order.trackingNumber}
											<button class="uk-button uk-button-warning" data-ship={order.transactionId} on:click={()=>ship(order.transactionId)}>
												[Seller] Make a Shipment
											</button>
										{:else if !order.isDelivered}
											<button class="uk-button uk-button-primary" data-delivered={order.transactionId} on:click={()=>delivered(order.transactionId)}>
												[Admin] Update Shipping Status
											</button>
										{:else if !order.isCompleted}
											<button class="uk-button uk-button-success" data-complete={order.transactionId} on:click={()=>complete(order.transactionId)}>
												[Buyer] Release the Payment
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
