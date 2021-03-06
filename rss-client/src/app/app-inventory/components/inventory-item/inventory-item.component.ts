import { Component, OnInit, Input } from '@angular/core';
import { Product } from '../../class/product/product';
import { NgbModal, ModalDismissReasons, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SortService } from '../../service/sort.service';
import { InventoryService } from '../../service/inventory.service';
import { NgForm, FormControl, FormGroup, Validators } from '@angular/forms';
import { Cart } from 'src/app/interfaces/cart.model';
import { User } from 'src/app/interfaces/user';
import { UserService } from 'src/app/services/user.service';
import { CartService } from 'src/app/services/cart.service';
import { CartItemService } from 'src/app/services/cart-item.service';
import { CartItem } from 'src/app/interfaces/cart-item.model';

@Component({
	selector: 'app-inventory-item',
	templateUrl: './inventory-item.component.html',
	styleUrls: ['./inventory-item.component.css'],
})
export class InventoryItemComponent implements OnInit {

	@Input() product: Product;
	@Input() userType: string;
	admin: boolean = true;
	localQuantity: number;
	activeCart: Cart;
	currentUser: User;

	nProduct: Product = new Product();

	negativeQ: boolean = false;

	updateProduct: FormGroup;

	get name() { return this.updateProduct.get('name') }
	get image() { return this.updateProduct.get('image') }
	get quantity() { return this.updateProduct.get('quantity') }
	get unitPrice() { return this.updateProduct.get('unitPrice') }

	constructor(
		private modalService: NgbModal,
		public service: SortService,
		public activeModal: NgbActiveModal,
		private inventoryService: InventoryService,
		private userService: UserService,
		private cartItemService: CartItemService) {
	}

	ngOnInit(): void {
		this.localQuantity = this.product.quantity;
		if (this.userType === 'admin') {
			this.admin = false;
		}

		this.updateProduct = new FormGroup({
			id: new FormControl(this.product.id),
			name: new FormControl({ value: this.product.name, disabled: this.admin }, [Validators.required]),
			brand: new FormControl({ value: this.product.brand, disabled: this.admin }),
			description: new FormControl({ value: this.product.description, disabled: this.admin }),
			model: new FormControl({ value: this.product.model, disabled: this.admin }),
			category: new FormControl({ value: this.product.category, disabled: this.admin }),
			image: new FormControl({ value: this.product.image, disabled: this.admin }),
			quantity: new FormControl(this.product.quantity, [Validators.required]),
			unitPrice: new FormControl({ value: this.product.unitPrice, disabled: this.admin }, [Validators.required]),
			color: new FormControl({ value: this.product.color, disabled: this.admin }),
		});

		this.currentUser = this.userService.getCurrentUser();

		if (!this.currentUser.admin) {
			if (sessionStorage.getItem("myactivecart")) {
				this.activeCart = JSON.parse(sessionStorage.getItem("myactivecart"));
			} else if (sessionStorage.getItem('defaultcart')) {
				this.activeCart = JSON.parse(sessionStorage.getItem('defaultcart'));
				sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
				sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId));
			} else {
				this.activeCart = new Cart(0, this.currentUser.userId, "(default)", []);
				sessionStorage.setItem('defaultcart', JSON.stringify(this.activeCart));
				sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
				sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId));
			}
		}
	}

	reduceInventory() {
		let quantityLeft = this.localQuantity - this.quantity.value;
		console.log(quantityLeft);
		if (quantityLeft >= 0 && this.quantity.value >= 0) {
			// console.log(this.activeCart);
			// Copy the active cart for establishing ownership in the backend
			let activeCartCopy: Cart = {
				cartId: this.activeCart.cartId,
				userId: this.activeCart.userId,
				name: this.activeCart.name,
				cartItems: []
			}
			// Check activeCart's cart items for an existing product
			let existingCartItem: CartItem = null;
			for (let cartItem of this.activeCart.cartItems) {
				if (cartItem.productId == this.product.id) {
					cartItem.quantity += this.quantity.value;
					existingCartItem = cartItem;
					break;
				}
			}
			// console.log(existingCartItem);
			if (existingCartItem) {
				// udpate the cart item if there's one to update
				// console.log("Found existing cart item.")
				if (this.activeCart.cartId == 0) {
					// console.log("This is a default cart.")
					sessionStorage.setItem('defaultcart', JSON.stringify(this.activeCart));
					sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
					sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId))
				} else {
					// console.log("This is not a default cart.")
					let updateCartItem = {
						cartItemId: existingCartItem.cartItemId,
						cart: activeCartCopy,
						productId: existingCartItem.productId,
						quantity: existingCartItem.quantity
					}
					this.cartItemService.updateCartItem(updateCartItem).subscribe(
						() => {
							// console.log("I updated the backend")
							// Find the active cart's corresponding cart item and update the quantity
							for (let i = 0; i < this.activeCart.cartItems.length; i++) {
								if (this.activeCart.cartItems[i].cartItemId == existingCartItem.cartItemId) {
									this.activeCart.cartItems[i].quantity = existingCartItem.quantity;
									break;
								}
							}
							// Update the active cart and activecartId
							sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
							sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId))
						}
					)
				}
			} else {
				// console.log("This is a new cart item.");
				// Add new cart item (cartItemId will be autogenerated so long as it doesn't exist in the DB)
				let cartItemToAdd = {
					cartItemId: -1 - this.activeCart.cartItems.length,
					cart: activeCartCopy,
					productId: this.product.id,
					quantity: this.quantity.value
				}
				if (this.activeCart.cartId == 0) {
					// console.log("This is a default cart");
					// console.log(cartItemToAdd);
					this.activeCart.cartItems.push(cartItemToAdd);
					sessionStorage.setItem('defaultcart', JSON.stringify(this.activeCart));
					sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
					sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId));
				} else {
					// console.log("this is not a default cart.")
					this.cartItemService.addCartItem(cartItemToAdd).subscribe(
						cartItem => {
							// console.log("I updated the backend");
							this.activeCart.cartItems.push(cartItem);
							sessionStorage.setItem('myactivecart', JSON.stringify(this.activeCart));
							sessionStorage.setItem('activecartId', JSON.stringify(this.activeCart.cartId));
						}
					);
				}
			}
			this.activeModal.dismiss('Put items in cart');
		} else {
			// this.modalService.dismissAll();
			this.quantity.setValue(this.localQuantity);
			this.negativeQ = true;
			// alert("Insufficient inventory.");
		}
	}

	updateItem() {
		if (this.updateProduct.valid) {
			this.inventoryService
				.updateProduct(this.updateProduct.value)
				.subscribe((res) => {
					if (res) {
						this.inventoryService.getAllProducts()
							.subscribe(inventory => {
								this.service.setInventory(inventory);
								this.modalService.dismissAll();
							})
					}
				});
		} else {
			alert("Update Invalid.");
		}

	}

	private getDismissReason(reason: any): string {
		if (reason === ModalDismissReasons.ESC) {
			return 'by pressing ESC';
		} else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
			return 'by clicking on a backdrop';
		} else {
			return `with: ${reason}`;
		}
	}
}