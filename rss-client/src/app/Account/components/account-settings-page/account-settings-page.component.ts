import { ImageService } from './../../../services/image.service';
import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/interfaces/user';
import { Account } from 'src/app/interfaces/account';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-account-settings-page',
  templateUrl: './account-settings-page.component.html',
  styleUrls: ['./account-settings-page.component.css'],
})
export class AccountSettingsPageComponent implements OnInit {
  user: User;
  isLoggedIn;
  userProfileForm: FormGroup;
  evalAccount: Account;
  myAccount: Account = {
    accId: 0,
    accTypeId: 0,
    userId: 0,
    points: 0
  };
  accounts: Account[];

  constructor(
    private imageservice: ImageService,
    private userservice: UserService,
    private fb: FormBuilder,
    private accountService: AccountService
  ) { }



  selectedFile: string;
  imagePreview: any;
  placeholderPic = '../../../../assets/Images/user_image.png';
  onFileChanged(event) {
    if (event.target.value) {
      const file = event.target.files[0];
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      }).then((base64: string): any => {
        this.imagePreview = [base64];
        this.selectedFile = base64;
      });
    }
  }
  onUpload() {
    let arr = this.selectedFile.split(',');
    this.imageservice.uploadImage(this.user.userId, arr[1]).subscribe();
    this.user.profilePic = arr[1];
    this.userservice.changeUser(this.user);
  }

  ngOnInit(): void {
    this.userProfileForm = this.fb.group({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
    });
    this.getUser();
    this.accountService.getAccountByUserId(this.user).subscribe(res => {
      console.log(res[0]);
      this.evalAccount = res[0];
      console.log(this.evalAccount)
    })
    this.grabAccounts();
  }

  getUser() {
    this.user = this.userservice.userPersistance();
    console.log(this.user.password);
    this.editForm(this.user);
    console.log(this.user);
  }
  editForm(user: User) {
    this.userProfileForm.patchValue({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  }

  async submitForm() {
    const formValue = this.userProfileForm.value;
    console.log(formValue);
    this.userservice.updateInfo(formValue).subscribe((res) => {
      console.log(`User has updated their info`);
    });
  }

  createAccount(event) {
    if (event == "Eval") {
      let num = this.accounts[1].accTypeId
      this.myAccount.accTypeId = num;
      this.myAccount.userId = this.userservice.userPersistance().userId
    } else if (event == "Bug") {
      console.log(this.accounts[0].accTypeId);
      this.myAccount.accTypeId = this.accounts[0].accTypeId
      this.myAccount.userId = this.userservice.userPersistance().userId
    }
    console.log(this.myAccount)
    this.accountService.createAccount(this.myAccount).subscribe(
      res => { console.log(res) }
    );
  }

  grabAccounts() {
    return this.accountService.getAllAccounts().subscribe(res => {
      this.accounts = res;
      console.log(this.accounts);
    })
  }
}
