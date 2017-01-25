import { Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InAppBrowser } from 'ionic-native';
import { Content, NavController, LoadingController, ActionSheetController } from 'ionic-angular';
import { Http } from '@angular/http';
import { RedditService } from '../../providers/reddit-service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public feeds: Array<string>;
  private url: string = 'https://www.reddit.com/new.json';
  private olderPosts: string = 'https://www.reddit.com/new.json?after=';
  private newerPosts: string = 'https://www.reddit.com/new.json?before=';
  public noFilter: Array<any>;
  public hasFilter: boolean = false;
  private searchTerm: string = '';
  private searchTermControl: FormControl;

  public searchPlaceholder: string = 'Type here...';

  constructor(public redditService: RedditService, public navCtrl: NavController, public loadingCtrl: LoadingController, public actionSheetCtrl: ActionSheetController, public http: Http) {
    this.fetchContent();
    this.searchTermControl = new FormControl();
    this.searchTermControl.valueChanges
      .debounceTime(3000)
      .distinctUntilChanged()
      .subscribe(search => {
        if (search !== '' && search) {
          this.filterItems();
        }
       })
  
  }

  fetchContent(): void {
    let loading = this.loadingCtrl.create({ content: 'Loading posts...' });
    loading.present();
        
    this.redditService.fetchData(this.url).then(data => {
      this.feeds = data;
      this.noFilter = this.feeds;
      loading.dismiss();
    });
  }

  doInfinite(inifiniteScroll) {
    
    let paramsUrl = (this.feeds.length > 0) ?
      this.feeds[this.feeds.length - 1]["data"].name : "";

    this.http.get(this.olderPosts + paramsUrl).map(res => res.json())
      .subscribe(data => { this.feeds = 
        this.feeds.concat(data.data.children);
        this.feeds.forEach((e, i, a) => { 
          if (!e["data"].thumbnail || e["data"].thumbnail.indexOf('b.thumbs.redditmedia.com') === -1 ) { 
              e["data"].thumbnail = 'http://www.redditstatic.com/icon.png'; 
          } 
        })

        inifiniteScroll.complete();

        this.noFilter = this.feeds;
        this.hasFilter = false;
    });
  }

  itemSelected(url: string): void {
    new InAppBrowser(url, '_system');
  
  }

  doRefresh(refresher) {
    
    let paramsUrl = this.feeds[0]["data"].name;
    this.http.get(this.newerPosts + paramsUrl).map(res => res.json())
      .subscribe(data => { this.feeds = 
        data['data'].children.concat(this.feeds);
        this.feeds.forEach((e, i, a) => { 
          if (!e["data"].thumbnail || e["data"].thumbnail.indexOf('b.thumbs.redditmedia.com') === -1 ) { 
              e["data"].thumbnail = 'http://www.redditstatic.com/icon.png'; 
          } 
        })

        refresher.complete();

        this.noFilter = this.feeds;
        this.hasFilter = false;
    });
  }

  @ViewChild(Content) content: Content;
  showFilters(): void {
    this.content.scrollToTop();

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Filter Options:',
      buttons: [
        {
          text: 'Music',
          handler: () => {
            this.feeds = this.noFilter.filter((item) => item.data.subreddit.toLowerCase() === 'music');
            this.hasFilter = true;
          }
        },
        {
          text: 'Movies',
          handler: () => {
            this.feeds = this.noFilter.filter((item) => item.data.subreddit.toLowerCase() === 'movies');
            this.hasFilter = true;
          }
        },
        {  
          text: 'Shower Thougths',
          handler: () => {
            this.feeds = this.noFilter.filter((item) => item.data.subreddit.toLowerCase() === 'showerthoughts');
            this.hasFilter = true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.feeds = this.noFilter;
            this.hasFilter = false;
          }
        }
      ]
    });

    actionSheet.present();
  }

  filterItems() {
    this.hasFilter = false;
    this.feeds = this.noFilter.filter((item) => {
    return item.data.title.toLowerCase()
      .indexOf(this.searchTerm.toLowerCase()) > -1;
    })
  }

}
